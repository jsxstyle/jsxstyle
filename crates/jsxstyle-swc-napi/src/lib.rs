use std::collections::HashMap;

use napi_derive::napi;
use swc_core::common::comments::SingleThreadedComments;
use swc_core::common::input::StringInput;
use swc_core::common::source_map::DefaultSourceMapGenConfig;
use swc_core::common::sync::Lrc;
use swc_core::common::{BytePos, FileName, Mark, SourceMap, GLOBALS};
use swc_core::ecma::codegen::text_writer::JsWriter;
use swc_core::ecma::codegen::Emitter;
use swc_core::ecma::parser::lexer::Lexer;
use swc_core::ecma::parser::{Parser, Syntax, TsSyntax};
use swc_core::ecma::visit::VisitMutWith;

use jsxstyle_swc_core::StaticValue;

/// Options for the jsxstyle transform.
///
/// All options are serialized data (no JS Function callbacks). Class name
/// generation happens entirely in Rust.
#[napi(object)]
pub struct TransformOptions {
    /// Class name strategy: "counter" for sequential, "hash" for content-based.
    pub class_name_strategy: String,
    /// Prefix for generated class names (e.g., "_x").
    pub class_name_prefix: String,
    /// Enable debug class names in dev mode.
    pub debug_class_names: Option<bool>,
    /// Pre-populated cache object for persistent class name mapping.
    /// Maps style key -> class name. Returned in the output for persistence.
    pub cache_object: Option<HashMap<String, String>>,
    /// Enables noRuntime mode where unextractable style props trigger diagnostics.
    /// Valid values: "warn" or "error".
    pub no_runtime: Option<String>,
    /// Static exports from dependency modules, keyed by import specifier.
    /// Specifier is the raw string from the import declaration (e.g., "./tokens").
    /// Each module maps export name -> JSON-serialized static value.
    pub external_bindings: Option<HashMap<String, HashMap<String, serde_json::Value>>>,
}

/// Result of transforming jsxstyle source code.
#[napi(object)]
pub struct TransformOutput {
    /// The transformed JavaScript source code.
    pub code: String,
    /// The extracted CSS rules.
    pub css: String,
    /// JSON-serialized source map, if available.
    pub map: Option<String>,
    /// Cache object containing all style key -> class name mappings.
    /// Pass back into the next transform call for consistent class names.
    pub cache_object: HashMap<String, String>,
    /// Error messages collected during the transform (noRuntime "error" mode).
    pub errors: Vec<String>,
    /// Warning messages collected during the transform (noRuntime "warn" mode).
    pub warnings: Vec<String>,
    /// Static exports detected in this module.
    /// Maps export name -> JSON-serialized static value.
    pub static_exports: HashMap<String, serde_json::Value>,
}

/// Convert a StaticValue to a serde_json::Value for NAPI serialization.
fn static_value_to_json(value: &StaticValue) -> serde_json::Value {
    match value {
        StaticValue::String(s) => serde_json::Value::String(s.clone()),
        StaticValue::Number(n) => {
            serde_json::json!(*n)
        }
        StaticValue::Bool(b) => serde_json::Value::Bool(*b),
        StaticValue::Null => serde_json::Value::Null,
        StaticValue::Undefined => serde_json::Value::Null,
        StaticValue::Object(map) => {
            let obj: serde_json::Map<String, serde_json::Value> = map
                .iter()
                .map(|(k, v)| (k.clone(), static_value_to_json(v)))
                .collect();
            serde_json::Value::Object(obj)
        }
    }
}

/// Convert a serde_json::Value to a StaticValue for use in the Rust transform.
fn json_to_static_value(value: &serde_json::Value) -> Option<StaticValue> {
    match value {
        serde_json::Value::String(s) => Some(StaticValue::String(s.clone())),
        serde_json::Value::Number(n) => n.as_f64().map(StaticValue::Number),
        serde_json::Value::Bool(b) => Some(StaticValue::Bool(*b)),
        serde_json::Value::Null => Some(StaticValue::Null),
        serde_json::Value::Object(map) => {
            let mut obj = indexmap::IndexMap::new();
            for (k, v) in map {
                let sv = json_to_static_value(v)?;
                obj.insert(k.clone(), sv);
            }
            Some(StaticValue::Object(obj))
        }
        serde_json::Value::Array(_) => None, // Arrays not supported in StaticValue
    }
}

/// Extract non-jsxstyle import specifiers from source code using SWC's parser.
///
/// Parses the source as TypeScript/TSX and walks the AST for ImportDecl nodes.
/// Returns specifier strings for all imports that are not jsxstyle packages.
/// Includes relative imports (`./foo`), aliased paths (`@/foo`), and bare
/// specifiers (`lodash`) — the bundler resolver handles path resolution.
#[napi]
pub fn extract_import_specifiers(source: String) -> napi::Result<Vec<String>> {
    GLOBALS.set(&Default::default(), || {
        let cm: Lrc<SourceMap> = Lrc::new(SourceMap::default());
        let fm = cm.new_source_file(FileName::Custom("extract.ts".to_string()).into(), source);

        let lexer = Lexer::new(
            Syntax::Typescript(TsSyntax {
                tsx: true,
                ..Default::default()
            }),
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);
        let module = parser
            .parse_module()
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse source: {e:?}")))?;

        let mut specifiers = Vec::new();
        for item in &module.body {
            if let swc_core::ecma::ast::ModuleItem::ModuleDecl(
                swc_core::ecma::ast::ModuleDecl::Import(import_decl),
            ) = item
            {
                // Skip type-only imports
                if import_decl.type_only {
                    continue;
                }
                let src = match import_decl.src.value.as_str() {
                    Some(s) => s,
                    None => continue,
                };
                // Skip jsxstyle packages
                if src.starts_with("@jsxstyle/") {
                    continue;
                }
                specifiers.push(src.to_string());
            }
        }

        Ok(specifiers)
    })
}

/// Transform jsxstyle components in source code, extracting static styles to CSS.
///
/// Parses the source with SWC (TSX syntax), applies the jsxstyle transform visitor,
/// codegens the transformed AST, and returns code, CSS, source map, cache, and diagnostics.
///
/// # Arguments
/// * `source` - The source code to transform
/// * `filename` - The filename for error reporting and source maps
/// * `options` - Transform options with serialized configuration (no JS callbacks)
///
/// # Returns
/// A `TransformOutput` with `code`, `css`, `map`, `cacheObject`, `errors`, `warnings`, `staticExports`
#[napi]
pub fn transform(
    source: String,
    filename: String,
    options: TransformOptions,
) -> napi::Result<TransformOutput> {
    GLOBALS.set(&Default::default(), || {
        let cm: Lrc<SourceMap> = Lrc::new(SourceMap::default());
        let filename_for_visitor = filename.clone();
        let fm = cm.new_source_file(FileName::Custom(filename).into(), source);

        let lexer = Lexer::new(
            Syntax::Typescript(TsSyntax {
                tsx: true,
                ..Default::default()
            }),
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);
        let mut module = parser
            .parse_module()
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse source: {e:?}")))?;

        // Apply resolver to set up SyntaxContext for binding identity
        let unresolved_mark = Mark::new();
        let top_level_mark = Mark::new();
        module.visit_mut_with(&mut swc_core::ecma::transforms::base::resolver(
            unresolved_mark,
            top_level_mark,
            true,
        ));

        // Parse class name strategy
        let strategy = match options.class_name_strategy.as_str() {
            "counter" => jsxstyle_swc_core::ClassNameStrategy::Counter,
            "hash" => jsxstyle_swc_core::ClassNameStrategy::Hash,
            other => {
                return Err(napi::Error::from_reason(format!(
                    "Invalid classNameStrategy: \"{other}\". Expected \"counter\" or \"hash\"."
                )));
            }
        };

        // Create visitor with Rust-side class name generation (no JS callback overhead)
        let mut visitor = jsxstyle_swc_core::create_transform_with_options(
            strategy,
            options.class_name_prefix,
            options.debug_class_names.unwrap_or(false),
            options.cache_object.unwrap_or_default(),
        );

        // Wire noRuntime mode
        use jsxstyle_swc_core::NoRuntimeMode;
        visitor.no_runtime = match options.no_runtime.as_deref() {
            Some("error") => NoRuntimeMode::Error,
            Some("warn") => NoRuntimeMode::Warn,
            _ => NoRuntimeMode::Off,
        };

        // Convert external_bindings from JSON to StaticValue
        if let Some(ext_bindings) = options.external_bindings {
            let mut converted: HashMap<String, HashMap<String, StaticValue>> = HashMap::new();
            for (specifier, exports) in ext_bindings {
                let mut module_exports: HashMap<String, StaticValue> = HashMap::new();
                for (name, json_val) in exports {
                    if let Some(static_val) = json_to_static_value(&json_val) {
                        module_exports.insert(name, static_val);
                    }
                }
                if !module_exports.is_empty() {
                    converted.insert(specifier, module_exports);
                }
            }
            visitor.external_bindings = converted;
        }

        // Pass source map and filename for enriched error messages
        visitor.source_map = Some(cm.clone());
        visitor.filename = Some(filename_for_visitor);

        // Create comments store for PURE annotations (useMatchMedia)
        visitor.comments = Some(SingleThreadedComments::default());

        module.visit_mut_with(&mut visitor);

        // Collect results from visitor
        let css = visitor.get_css();
        let errors = std::mem::take(&mut visitor.errors);
        let warnings = std::mem::take(&mut visitor.warnings);

        // Serialize static exports to JSON
        let static_exports: HashMap<String, serde_json::Value> = visitor
            .get_static_exports()
            .iter()
            .map(|(k, v)| (k.clone(), static_value_to_json(v)))
            .collect();

        // Extract cache from the generator
        let cache_object = visitor
            .class_name_gen
            .take()
            .map(|gen| gen.into_cache())
            .unwrap_or_default();

        // Take comments from visitor for codegen (PURE annotations etc.)
        let comments = visitor.comments.take();

        // Codegen with source map collection
        let mut srcmap_buf: Vec<(BytePos, swc_core::common::LineCol)> = Vec::new();
        let mut buf = Vec::new();
        {
            let mut emitter = Emitter {
                cfg: swc_core::ecma::codegen::Config::default()
                    .with_minify(false)
                    .with_ascii_only(false),
                cm: cm.clone(),
                comments: comments
                    .as_ref()
                    .map(|c| c as &dyn swc_core::common::comments::Comments),
                wr: JsWriter::new(cm.clone(), "\n", &mut buf, Some(&mut srcmap_buf)),
            };
            emitter
                .emit_module(&module)
                .map_err(|e| napi::Error::from_reason(format!("Failed to emit module: {e:?}")))?;
        }

        // Build source map from collected mappings
        let map = if !srcmap_buf.is_empty() {
            let source_map = cm.build_source_map(&srcmap_buf, None, DefaultSourceMapGenConfig);
            let mut srcmap_json = Vec::new();
            source_map.to_writer(&mut srcmap_json).map_err(|e| {
                napi::Error::from_reason(format!("Failed to serialize source map: {e:?}"))
            })?;
            Some(String::from_utf8(srcmap_json).map_err(|e| {
                napi::Error::from_reason(format!("Invalid UTF-8 in source map: {e}"))
            })?)
        } else {
            None
        };

        let code = String::from_utf8(buf)
            .map_err(|e| napi::Error::from_reason(format!("Invalid UTF-8 in output: {e}")))?;

        Ok(TransformOutput {
            code,
            css,
            map,
            cache_object,
            errors,
            warnings,
            static_exports,
        })
    })
}
