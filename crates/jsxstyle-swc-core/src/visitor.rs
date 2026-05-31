use indexmap::IndexMap;
use rustc_hash::{FxBuildHasher, FxHashMap};

use swc_core::common::comments::SingleThreadedComments;
use swc_core::common::sync::Lrc;
use swc_core::common::{SourceMap, DUMMY_SP};
use swc_core::ecma::ast::{BinaryOp, Id};
use swc_core::ecma::ast::{
    Ident, JSXAttrName, JSXAttrOrSpread, JSXAttrValue, JSXElement, JSXElementName, JSXExpr, Module,
    ModuleDecl, ModuleItem,
};
use swc_core::ecma::visit::{VisitMut, VisitMutWith};

use crate::binding_resolver::{collect_const_bindings, collect_exported_bindings};
use crate::css_gen::{
    build_style_key, expand_shorthand, generate_css_rule, generate_css_rule_full, parse_prop_name,
    ClassNameGenerator, ParsedProp,
};
use crate::custom_properties;
use crate::dangerous_style_value::dangerous_style_value;
use crate::generated_constants::get_component_defaults;
use crate::hyphenate::hyphenate_style_name;
use crate::import_tracker::{scan_imports, NonComponentImport, NonComponentImportEntry};
use crate::jsx_rewriter::{
    build_combined_class_attr, build_element_name, build_runtime_element_name,
    build_ternary_class_attr, props_to_spread,
};
use crate::match_media;
use crate::prop_classifier::{is_component_prop, is_skipped_prop};
use crate::static_eval::evaluate_expr;
use crate::ternary::{
    convert_style_tree_to_class_parts, expr_to_grouping_key, get_style_value, update_style_tree,
    StyleTree, StyleValue,
};
use crate::types::{atom_to_string, ClassNamePart, CssRule, StaticValue};

/// Controls how unextractable style props are reported.
///
/// - `Off` (default): No error or warning messages are produced.
/// - `Warn`: Unextractable props produce warning messages via `warn_callback`.
/// - `Error`: Unextractable props produce error messages via `error_callback`.
#[derive(Default, Clone, PartialEq)]
pub enum NoRuntimeMode {
    #[default]
    Off,
    Warn,
    Error,
}

/// A collected style prop entry, ready for deduplication and CSS generation.
/// Matches Babel's parsedStyleProps: keyed by `propName + keySuffix` so that
/// later props with the same key override earlier ones (e.g., marginH expansion
/// then explicit marginLeft).
#[derive(Clone)]
struct StylePropEntry {
    /// Key used for deduplication (matches Babel's parsedStyleProps object key).
    dedup_key: String,
    /// The resolved CSS property name (camelCase).
    css_prop_name: String,
    /// The static value for this property.
    value: StaticValue,
    /// Parsed prefix metadata (pseudo class/element, base specificity).
    parsed: ParsedProp,
    /// Media/container query string, if any.
    query_string: Option<String>,
    /// Ampersand selector string, if any (e.g., "& > span").
    ampersand_string: Option<String>,
}

/// Build a dedup key matching Babel's parsedStyleProps key format.
/// In parseStyleProps.ts, the key is `propName + keySuffix` where
/// keySuffix = queryString + '::' + pseudoelement + ':' + pseudoclass.
fn build_dedup_key(
    prop_name: &str,
    pseudo_class: Option<&str>,
    pseudo_element: Option<&str>,
    query_string: Option<&str>,
    ampersand_string: Option<&str>,
) -> String {
    let mut key = prop_name.to_string();
    if let Some(qs) = query_string {
        key.push_str(qs);
    }
    if let Some(pe) = pseudo_element {
        key.push_str("::");
        key.push_str(pe);
    }
    if let Some(pc) = pseudo_class {
        key.push(':');
        key.push_str(pc);
    }
    if let Some(amp) = ampersand_string {
        key.push_str(amp);
    }
    key
}

/// The core jsxstyle transform visitor.
///
/// Implements a multi-pass approach:
/// 1. `visit_mut_module`: Scan imports to populate `valid_components`
/// 2. `visit_mut_jsx_element`: Transform jsxstyle JSX elements
pub struct TransformVisitor {
    // --- Internal fields (crate-only access) ---
    /// Which jsxstyle package was imported (e.g., "@jsxstyle/react").
    pub(crate) jsxstyle_source: Option<String>,
    /// Map from local binding Id (Atom, SyntaxContext) to imported component name.
    pub(crate) valid_components: FxHashMap<Id, String>,
    /// The className prop name: "className" for react/solid, "class" for preact.
    pub(crate) class_prop_name: &'static str,
    /// Accumulated CSS rules from transformed elements.
    pub(crate) css_rules: Vec<CssRule>,
    /// Cache: style key -> class name (avoids rehashing).
    pub(crate) class_name_cache: FxHashMap<String, String>,
    /// Const bindings collected from top-level const declarations.
    /// Maps binding Id -> evaluated static value.
    pub(crate) const_bindings: FxHashMap<Id, StaticValue>,
    /// Index of the jsxstyle import declaration in module.body.
    pub(crate) import_decl_index: usize,
    /// Whether Box is already imported from the jsxstyle source.
    pub(crate) has_box_import: bool,
    /// Whether we need to inject a Box import (set during JSX processing).
    pub(crate) needs_box_import: bool,
    /// Map from renamed useMatchMedia binding name to media query string.
    /// Populated during the advanced extraction pre-pass. Used during JSX processing
    /// to route ternary tests to @media CSS rules.
    pub(crate) media_queries_by_key: FxHashMap<String, String>,
    /// Non-component imports from jsxstyle packages (useMatchMedia, makeCustomProperties, css).
    /// Populated during import scanning.
    pub(crate) non_component_imports: Vec<NonComponentImportEntry>,

    // --- Public fields (accessed from NAPI binding or external crates) ---
    /// External bindings from dependency modules.
    /// Keyed by import specifier (raw string from import declaration, e.g., "./tokens"),
    /// mapping export name → StaticValue.
    /// Set by the NAPI binding before transform; used to populate const_bindings
    /// for imported identifiers.
    pub external_bindings:
        std::collections::HashMap<String, std::collections::HashMap<String, StaticValue>>,

    /// Static exports detected after transform.
    /// Maps exported name → StaticValue for all exports that could be statically evaluated.
    /// Populated after the transform pass completes.
    pub static_exports: IndexMap<String, StaticValue>,

    /// Configurable class name generation function.
    /// Defaults to the internal DJB2a hash function (css_gen::get_class_name).
    /// Used by tests and the legacy NAPI path. When `class_name_gen` is Some,
    /// the generator is used instead.
    pub class_name_fn: Box<dyn Fn(&str) -> String>,
    /// Optional class name generator (new API). When set, takes precedence
    /// over `class_name_fn`. Supports counter and hash strategies natively
    /// in Rust without JS callback overhead.
    pub class_name_gen: Option<ClassNameGenerator>,
    /// Controls how unextractable style props are reported.
    /// The transform still produces Box fallback output (errors/warnings are advisory).
    pub no_runtime: NoRuntimeMode,
    /// Collected error messages from the transform (noRuntime "error" mode).
    pub errors: Vec<String>,
    /// Collected warning messages from the transform (noRuntime "warn" mode).
    pub warnings: Vec<String>,
    /// Source map for resolving byte positions to line:column (for enriched error messages).
    pub source_map: Option<Lrc<SourceMap>>,
    /// Source filename (for enriched error messages).
    pub filename: Option<String>,
    /// SWC comments store for attaching `/*#__PURE__*/` annotations.
    /// Created by the NAPI binding and taken out after transform for codegen.
    pub comments: Option<SingleThreadedComments>,
}

impl Default for TransformVisitor {
    fn default() -> Self {
        Self {
            // Internal fields
            jsxstyle_source: None,
            valid_components: FxHashMap::default(),
            class_prop_name: "",
            css_rules: Vec::new(),
            class_name_cache: FxHashMap::default(),
            const_bindings: FxHashMap::default(),
            import_decl_index: 0,
            has_box_import: false,
            needs_box_import: false,
            media_queries_by_key: FxHashMap::default(),
            non_component_imports: Vec::new(),
            // Public fields
            external_bindings: std::collections::HashMap::new(),
            static_exports: IndexMap::new(),
            class_name_fn: Box::new(crate::css_gen::get_class_name),
            class_name_gen: None,
            no_runtime: NoRuntimeMode::Off,
            errors: Vec::new(),
            warnings: Vec::new(),
            source_map: None,
            filename: None,
            comments: None,
        }
    }
}

impl TransformVisitor {
    /// Generate a class name for the given style key.
    /// Uses `class_name_gen` if available, otherwise falls back to `class_name_fn`.
    fn gen_class_name(&mut self, key: &str) -> String {
        if let Some(ref mut gen) = self.class_name_gen {
            gen.get_class_name(key)
        } else {
            (self.class_name_fn)(key)
        }
    }

    /// Get the static exports collected after transform.
    pub fn get_static_exports(&self) -> &IndexMap<String, StaticValue> {
        &self.static_exports
    }

    /// Get the accumulated CSS output as a single string (one rule per line).
    pub fn get_css(&self) -> String {
        self.css_rules
            .iter()
            .map(|rule| rule.rule.as_str())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Format a source location string from a span (e.g., "(file.tsx:42:5)").
    /// Returns empty string if source_map or filename are not available.
    fn format_location(&self, span: swc_core::common::Span) -> String {
        if let (Some(ref cm), Some(ref fname)) = (&self.source_map, &self.filename) {
            let loc = cm.lookup_char_pos(span.lo);
            format!("({}:{}:{})", fname, loc.line, loc.col_display + 1)
        } else {
            String::new()
        }
    }

    /// Report a diagnostic message, collecting it into the appropriate vector based on mode.
    fn report_diagnostic(&mut self, message: &str) {
        match self.no_runtime {
            NoRuntimeMode::Error => {
                self.errors.push(message.to_string());
            }
            NoRuntimeMode::Warn => {
                self.warnings.push(message.to_string());
            }
            NoRuntimeMode::Off => {}
        }
    }

    /// Collect parsed style prop entries from an attribute name and value.
    ///
    /// Parses the prop name for pseudo prefixes, expands shorthand props,
    /// and returns entries keyed by their dedup key (matching Babel's parsedStyleProps).
    /// Later props with the same key will override earlier ones.
    fn collect_style_entries(
        attr_name: &str,
        value: &StaticValue,
        query_string: Option<&str>,
        ampersand_string: Option<&str>,
    ) -> Vec<StylePropEntry> {
        let parsed = parse_prop_name(attr_name);
        let mut entries = Vec::new();

        // Check for shorthand expansion
        if let Some(expanded_props) = expand_shorthand(&parsed.css_prop_name) {
            for expanded_prop in expanded_props {
                // Build the dedup key matching Babel's parsedStyleProps key format:
                // expandedPropName + keySuffix
                let dedup_key = build_dedup_key(
                    expanded_prop,
                    parsed.pseudo_class,
                    parsed.pseudo_element,
                    query_string,
                    ampersand_string,
                );
                entries.push(StylePropEntry {
                    dedup_key,
                    css_prop_name: expanded_prop.to_string(),
                    value: value.clone(),
                    parsed: parsed.clone(),
                    query_string: query_string.map(|s| s.to_string()),
                    ampersand_string: ampersand_string.map(|s| s.to_string()),
                });
            }
        } else {
            let dedup_key = build_dedup_key(
                &parsed.css_prop_name,
                parsed.pseudo_class,
                parsed.pseudo_element,
                query_string,
                ampersand_string,
            );
            entries.push(StylePropEntry {
                dedup_key,
                css_prop_name: parsed.css_prop_name.clone(),
                value: value.clone(),
                parsed,
                query_string: query_string.map(|s| s.to_string()),
                ampersand_string: ampersand_string.map(|s| s.to_string()),
            });
        }

        entries
    }

    /// Generate CSS rule and class name for a resolved style prop entry.
    /// Returns the class name if a CSS rule was generated.
    fn emit_css_for_entry(&mut self, entry: &StylePropEntry) -> Option<String> {
        let css_value = dangerous_style_value(&entry.css_prop_name, &entry.value)?;

        // Calculate total specificity
        let mut specificity = entry.parsed.specificity;
        if entry.query_string.is_some() {
            specificity += 2;
        }

        let key = build_style_key(
            &entry.css_prop_name,
            &css_value,
            entry.parsed.pseudo_class,
            entry.parsed.pseudo_element,
            entry.query_string.as_deref(),
            entry.ampersand_string.as_deref(),
        );

        if let Some(cached) = self.class_name_cache.get(&key) {
            return Some(cached.clone());
        }

        let class_name = self.gen_class_name(&key);
        self.class_name_cache.insert(key, class_name.clone());

        let rule = generate_css_rule_full(
            &class_name,
            &entry.css_prop_name,
            &css_value,
            specificity,
            entry.parsed.pseudo_class,
            entry.parsed.pseudo_element,
            entry.query_string.as_deref(),
            entry.ampersand_string.as_deref(),
        );

        self.css_rules.push(CssRule { rule });
        Some(class_name)
    }

    /// Process a simple style property (no pseudo/media context).
    /// Used for component defaults which are always plain CSS properties.
    /// Returns the class name if successful.
    /// Deduplicates CSS rules: same style key only emits one CSS rule.
    fn process_style_prop(&mut self, prop_name: &str, value: &StaticValue) -> Option<String> {
        let css_value = dangerous_style_value(prop_name, value)?;
        let key = format!("{prop_name}:{css_value}");
        if let Some(cached) = self.class_name_cache.get(&key) {
            return Some(cached.clone());
        }
        let class_name = self.gen_class_name(&key);
        self.class_name_cache.insert(key, class_name.clone());
        let rule = generate_css_rule(&class_name, prop_name, &css_value);
        self.css_rules.push(CssRule { rule });
        Some(class_name)
    }

    /// Generate CSS for an animation object value.
    ///
    /// Matches processProps.ts lines 45-121: processes keyframe objects,
    /// generates @keyframes rule and animation-name rule.
    /// Returns the class name if successful.
    fn emit_animation_css(
        &mut self,
        animation_obj: &indexmap::IndexMap<String, StaticValue>,
        parsed: &ParsedProp,
        query_string: Option<&str>,
    ) -> Option<String> {
        let mut animation_value = String::new();

        // Sort keyframe keys for deterministic output
        let mut sorted_keys: Vec<&String> = animation_obj.keys().collect();
        sorted_keys.sort();

        for key in sorted_keys {
            let frame_value = &animation_obj[key];
            let inner_obj = match frame_value {
                StaticValue::Object(obj) => obj,
                _ => return None, // Non-object keyframe value, skip entire animation
            };

            let mut group_styles = String::new();

            // Sort inner props for deterministic output
            let mut sorted_inner: Vec<&String> = inner_obj.keys().collect();
            sorted_inner.sort();

            for inner_key in sorted_inner {
                let inner_value = &inner_obj[inner_key];
                let inner_parsed = parse_prop_name(inner_key);

                // Check for pseudo prefixes in animation props (invalid per Babel)
                if inner_parsed.pseudo_class.is_some() || inner_parsed.pseudo_element.is_some() {
                    return None;
                }

                // Expand shorthands and process each expanded prop
                if let Some(expanded_props) = expand_shorthand(&inner_parsed.css_prop_name) {
                    for expanded_prop in expanded_props {
                        if let Some(css_val) = dangerous_style_value(expanded_prop, inner_value) {
                            if !group_styles.is_empty() {
                                group_styles.push(';');
                            }
                            group_styles.push_str(&hyphenate_style_name(expanded_prop));
                            group_styles.push(':');
                            group_styles.push_str(&css_val);
                        }
                    }
                } else if let Some(css_val) =
                    dangerous_style_value(&inner_parsed.css_prop_name, inner_value)
                {
                    if !group_styles.is_empty() {
                        group_styles.push(';');
                    }
                    group_styles.push_str(&hyphenate_style_name(&inner_parsed.css_prop_name));
                    group_styles.push(':');
                    group_styles.push_str(&css_val);
                }
            }

            if group_styles.is_empty() {
                return None; // Empty keyframe, skip entire animation
            }

            animation_value.push_str(key);
            animation_value.push('{');
            animation_value.push_str(&group_styles);
            animation_value.push('}');
        }

        if animation_value.is_empty() {
            return None;
        }

        // Check cache: if same animation value was already processed, reuse class name
        if let Some(cached) = self.class_name_cache.get(&animation_value) {
            return Some(cached.clone());
        }

        // Generate class name from animation value
        let class_name = self.gen_class_name(&animation_value);
        self.class_name_cache
            .insert(animation_value.clone(), class_name.clone());

        // Emit @keyframes rule
        let keyframes_rule = format!("@keyframes {class_name}{{{animation_value}}}");
        self.css_rules.push(CssRule {
            rule: keyframes_rule,
        });

        // Emit animation-name rule with specificity bump
        let mut specificity = parsed.specificity + 1; // animation gets +1
        if query_string.is_some() {
            specificity += 2;
        }

        let rule = generate_css_rule_full(
            &class_name,
            "animationName",
            &class_name,
            specificity,
            parsed.pseudo_class,
            parsed.pseudo_element,
            query_string,
            None,
        );

        self.css_rules.push(CssRule { rule });

        Some(class_name)
    }

    /// Process a statically-evaluated spread object, extracting @media, @container,
    /// ampersand, and regular style entries.
    ///
    /// Returns `true` if all entries were fully extracted; `false` if some entries
    /// were unextractable (caller should set `runtime_required` and preserve the attr).
    fn process_spread_styles(
        &mut self,
        spread_obj: &IndexMap<String, StaticValue>,
        class_names: &mut Vec<String>,
        collected_style_props: &mut IndexMap<String, StylePropEntry, FxBuildHasher>,
    ) -> bool {
        // Sort keys for deterministic output (IndexMap preserves insertion order,
        // but we sort for consistent output across different JS object orderings).
        let mut sorted_keys: Vec<&String> = spread_obj.keys().collect();
        sorted_keys.sort();

        let mut has_unextractable = false;
        for key in sorted_keys {
            let value = &spread_obj[key];
            let is_media = key.starts_with("@media ");
            let is_container = key.starts_with("@container ");
            if is_media || is_container {
                // @media/@container prop: value must be an Object
                if let StaticValue::Object(inner_obj) = value {
                    let mut sorted_inner: Vec<&String> = inner_obj.keys().collect();
                    sorted_inner.sort();

                    for inner_key in sorted_inner {
                        let inner_value = &inner_obj[inner_key];

                        // Check for ampersand key inside @media
                        if inner_key.contains('&') {
                            if let StaticValue::Object(amp_obj) = inner_value {
                                let mut sorted_amp: Vec<&String> = amp_obj.keys().collect();
                                sorted_amp.sort();

                                for amp_key in sorted_amp {
                                    let amp_value = &amp_obj[amp_key];
                                    let entries = Self::collect_style_entries(
                                        amp_key,
                                        amp_value,
                                        Some(key.as_str()),
                                        Some(inner_key.as_str()),
                                    );
                                    for entry in entries {
                                        collected_style_props
                                            .insert(entry.dedup_key.clone(), entry);
                                    }
                                }
                                continue;
                            }
                        }

                        // Check for animation inside @media
                        let inner_parsed = parse_prop_name(inner_key);
                        if inner_parsed.css_prop_name == "animation" {
                            if let StaticValue::Object(ref anim_obj) = inner_value {
                                if let Some(class_name) = self.emit_animation_css(
                                    anim_obj,
                                    &inner_parsed,
                                    Some(key.as_str()),
                                ) {
                                    class_names.push(class_name);
                                }
                                continue;
                            }
                        }

                        let entries = Self::collect_style_entries(
                            inner_key,
                            inner_value,
                            Some(key.as_str()),
                            None,
                        );
                        for entry in entries {
                            collected_style_props.insert(entry.dedup_key.clone(), entry);
                        }
                    }
                } else {
                    // @media/@container value is not an object -- skip
                    has_unextractable = true;
                }
            } else if key.contains('&') {
                // Ampersand selector key (e.g., "& > span")
                if let StaticValue::Object(inner_obj) = value {
                    let mut sorted_inner: Vec<&String> = inner_obj.keys().collect();
                    sorted_inner.sort();

                    for inner_key in sorted_inner {
                        let inner_value = &inner_obj[inner_key];
                        let entries = Self::collect_style_entries(
                            inner_key,
                            inner_value,
                            None,
                            Some(key.as_str()),
                        );
                        for entry in entries {
                            collected_style_props.insert(entry.dedup_key.clone(), entry);
                        }
                    }
                } else {
                    has_unextractable = true;
                }
            } else {
                // Check for animation in non-@media spread key
                let spread_parsed = parse_prop_name(key);
                if spread_parsed.css_prop_name == "animation" {
                    if let StaticValue::Object(ref anim_obj) = value {
                        if let Some(class_name) =
                            self.emit_animation_css(anim_obj, &spread_parsed, None)
                        {
                            class_names.push(class_name);
                        }
                        continue;
                    }
                }

                // Non-@media, non-ampersand key: regular style prop
                let entries = Self::collect_style_entries(key, value, None, None);
                for entry in entries {
                    collected_style_props.insert(entry.dedup_key.clone(), entry);
                }
            }
        }
        !has_unextractable
    }

    /// Process advanced extractions: useMatchMedia binding renames and makeCustomProperties chains.
    /// This pre-pass runs after import scanning and const binding collection, but before JSX traversal.
    fn process_advanced_extractions(&mut self, module: &mut Module) {
        // --- useMatchMedia ---
        let umm_imports: Vec<&NonComponentImportEntry> = self
            .non_component_imports
            .iter()
            .filter(|e| e.kind == NonComponentImport::UseMatchMedia)
            .collect();

        if !umm_imports.is_empty() {
            let renames = match_media::process_use_match_media(
                module,
                &umm_imports,
                &mut self.media_queries_by_key,
            );

            if !renames.is_empty() {
                match_media::apply_renames(module, &renames);

                // Add PURE comments if we have a comments store
                if let Some(comments) = self.comments.take() {
                    match_media::add_pure_comments(module, &umm_imports, &comments);
                    self.comments = Some(comments);
                }
            }
        }

        // --- makeCustomProperties ---
        let mcp_imports: Vec<&NonComponentImportEntry> = self
            .non_component_imports
            .iter()
            .filter(|e| e.kind == NonComponentImport::MakeCustomProperties)
            .collect();

        if !mcp_imports.is_empty() {
            custom_properties::process_custom_properties(
                module,
                &mcp_imports,
                &self.const_bindings,
                &mut self.css_rules,
            );
        }
    }
}

/// Build the output className attribute, combining extracted class names,
/// ternary parts, and any existing className from the original element.
///
/// Returns None if there are no class names to emit.
fn build_output_class_name(
    class_prop_name: &str,
    class_names: &[String],
    ternary_class_parts: Vec<ClassNamePart>,
    has_ternary_parts: bool,
    existing_class_value: Option<String>,
    existing_class_expr: Option<Box<swc_core::ecma::ast::Expr>>,
) -> Option<JSXAttrOrSpread> {
    use swc_core::ecma::ast::*;

    if has_ternary_parts {
        // Combine static class names with ternary parts from the style tree.
        let mut all_parts: Vec<ClassNamePart> = Vec::new();

        if let Some(ref existing) = existing_class_value {
            if !existing.is_empty() {
                all_parts.push(ClassNamePart::Static(existing.clone()));
            }
        }

        if !class_names.is_empty() {
            all_parts.push(ClassNamePart::Static(class_names.join(" ")));
        }

        all_parts.extend(ternary_class_parts);

        build_ternary_class_attr(class_prop_name, &all_parts, existing_class_expr)
            .map(JSXAttrOrSpread::JSXAttr)
    } else if let Some(dynamic_expr) = existing_class_expr {
        // Dynamic className expression (no ternary parts)
        let mut all_static_names: Vec<String> = class_names.to_vec();
        for part in &ternary_class_parts {
            if let ClassNamePart::Static(s) = part {
                if !s.is_empty() {
                    all_static_names.push(s.clone());
                }
            }
        }

        let extracted = all_static_names.join(" ");
        let class_attr_value = if extracted.is_empty() {
            JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: DUMMY_SP,
                expr: JSXExpr::Expr(dynamic_expr),
            })
        } else {
            let tpl = Tpl {
                span: DUMMY_SP,
                exprs: vec![dynamic_expr],
                quasis: vec![
                    TplElement {
                        span: DUMMY_SP,
                        tail: false,
                        cooked: Some(format!("{} ", extracted).into()),
                        raw: format!("{} ", extracted).into(),
                    },
                    TplElement {
                        span: DUMMY_SP,
                        tail: true,
                        cooked: Some("".into()),
                        raw: "".into(),
                    },
                ],
            };
            JSXAttrValue::JSXExprContainer(JSXExprContainer {
                span: DUMMY_SP,
                expr: JSXExpr::Expr(Box::new(Expr::Tpl(tpl))),
            })
        };
        Some(JSXAttrOrSpread::JSXAttr(JSXAttr {
            span: DUMMY_SP,
            name: JSXAttrName::Ident(IdentName::new(class_prop_name.into(), DUMMY_SP)),
            value: Some(class_attr_value),
        }))
    } else {
        // No ternary parts, no dynamic expr -- simple string className
        let mut all_static_names: Vec<String> = class_names.to_vec();
        for part in &ternary_class_parts {
            if let ClassNamePart::Static(s) = part {
                if !s.is_empty() {
                    all_static_names.push(s.clone());
                }
            }
        }

        build_combined_class_attr(
            class_prop_name,
            &all_static_names,
            existing_class_value.as_deref(),
        )
        .map(JSXAttrOrSpread::JSXAttr)
    }
}

impl VisitMut for TransformVisitor {
    fn visit_mut_module(&mut self, module: &mut Module) {
        // First pass: scan imports
        if let Some(scan_result) = scan_imports(module) {
            self.jsxstyle_source = Some(scan_result.jsxstyle_source);
            self.valid_components = scan_result.valid_components;
            self.class_prop_name = scan_result.class_prop_name;
            self.import_decl_index = scan_result.import_decl_index;
            self.has_box_import = scan_result.has_box_import;
            self.non_component_imports = scan_result.non_component_imports;
        } else {
            // No jsxstyle imports found — still collect static exports for dependency analysis
            self.const_bindings = collect_const_bindings(module);
            self.static_exports = collect_exported_bindings(module, &self.const_bindings);
            return;
        }

        // Second pass: collect const bindings from top-level declarations
        self.const_bindings = collect_const_bindings(module);

        // Pass 2.25: Resolve external bindings from dependency modules.
        // Walk all ImportDecl items and map imported identifiers to their
        // externally-provided static values.
        if !self.external_bindings.is_empty() {
            resolve_external_bindings(module, &self.external_bindings, &mut self.const_bindings);
        }

        // Pass 2.5: Process advanced extractions (useMatchMedia + makeCustomProperties)
        self.process_advanced_extractions(module);

        // Third pass: traverse the module to transform JSX elements
        module.visit_mut_children_with(self);

        // After traversal: inject Box import if needed and not already present
        if self.needs_box_import && !self.has_box_import {
            if let Some(source) = &self.jsxstyle_source {
                inject_box_import(module, self.import_decl_index, source);
            }
        }

        // Collect static exports for dependency analysis by other modules
        self.static_exports = collect_exported_bindings(module, &self.const_bindings);
    }

    fn visit_mut_jsx_element(&mut self, element: &mut JSXElement) {
        // Recurse children first (bottom-up processing)
        element.visit_mut_children_with(self);

        // Check if the opening element name is a valid jsxstyle component
        let component_name = match &element.opening.name {
            JSXElementName::Ident(id) => {
                match self.valid_components.get(&id.to_id()) {
                    Some(name) => name.clone(),
                    None => return, // Not a jsxstyle component
                }
            }
            _ => return, // Skip member expressions and namespaced names
        };

        // Collect class names from extracted style props
        let attr_count = element.opening.attrs.len();
        let mut class_names: Vec<String> = Vec::with_capacity(attr_count);

        // Existing className/class value from JSX attributes (to combine later)
        let mut existing_class_value: Option<String> = None;

        // Non-static className expression (e.g., className={someVar})
        let mut existing_class_expr: Option<Box<swc_core::ecma::ast::Expr>> = None;

        // Component prop value (controls output element name)
        let mut component_prop_value: Option<String> = None;

        // Original component prop attr (re-emitted if runtime_required)
        let mut component_prop_attr: Option<JSXAttrOrSpread> = None;

        // Props prop expression (becomes spread attribute on output)
        let mut props_prop_expr: Option<Box<swc_core::ecma::ast::Expr>> = None;

        // Runtime required: set when any non-component prop can't be statically evaluated
        let mut runtime_required = false;

        // Process component defaults first (lower priority -- JSX props override)
        if let Some(defaults) = get_component_defaults(&component_name) {
            for (prop_name, value) in defaults {
                let static_value = StaticValue::String(value.to_string());
                if let Some(class_name) = self.process_style_prop(prop_name, &static_value) {
                    class_names.push(class_name);
                }
            }
        }

        // Collected style props: deferred processing to allow later props to override
        // (matching Babel's parsedStyleProps object semantics where same-key entries overwrite).
        // IndexMap preserves insertion order while allowing O(1) key-based overwrites.
        let mut collected_style_props: IndexMap<String, StylePropEntry, FxBuildHasher> =
            IndexMap::with_hasher(FxBuildHasher);

        // Style tree for ternary/conditional style props (grouped by test expression)
        let mut style_tree = StyleTree::default();

        // Process JSX attributes
        let mut remaining_attrs: Vec<JSXAttrOrSpread> = Vec::with_capacity(attr_count);

        for attr in element.opening.attrs.drain(..) {
            match &attr {
                JSXAttrOrSpread::JSXAttr(jsx_attr) => {
                    let attr_name = match &jsx_attr.name {
                        JSXAttrName::Ident(id) => id.sym.as_ref().to_string(),
                        JSXAttrName::JSXNamespacedName(_) => {
                            // Pass through namespaced attributes (e.g., xml:lang)
                            remaining_attrs.push(attr);
                            continue;
                        }
                    };

                    // Handle component props (not style props)
                    if is_component_prop(&attr_name) {
                        // Handle special props extracted by the extractor
                        if is_skipped_prop(&attr_name) {
                            match attr_name.as_str() {
                                "component" => {
                                    // Extract component prop value
                                    match &jsx_attr.value {
                                        Some(JSXAttrValue::Str(s)) => {
                                            component_prop_value = Some(atom_to_string(&s.value));
                                            // Keep attr in case runtime_required is set later
                                            component_prop_attr = Some(attr);
                                        }
                                        Some(JSXAttrValue::JSXExprContainer(container)) => {
                                            match &container.expr {
                                                JSXExpr::Expr(expr) => {
                                                    // Try to evaluate statically
                                                    if let Some(StaticValue::String(s)) =
                                                        evaluate_expr(expr, &self.const_bindings)
                                                    {
                                                        component_prop_value = Some(s);
                                                        // Keep attr in case runtime_required is set later
                                                        component_prop_attr = Some(attr);
                                                    }
                                                    // If not evaluable, component prop can't be extracted
                                                    // This means runtime is required
                                                    else {
                                                        runtime_required = true;
                                                        remaining_attrs.push(attr);
                                                    }
                                                }
                                                _ => {
                                                    remaining_attrs.push(attr);
                                                }
                                            }
                                        }
                                        _ => {
                                            // No value or other cases -- pass through
                                            remaining_attrs.push(attr);
                                        }
                                    }
                                    continue;
                                }
                                "props" => {
                                    // Extract props prop expression (becomes spread)
                                    if let Some(JSXAttrValue::JSXExprContainer(container)) =
                                        &jsx_attr.value
                                    {
                                        if let JSXExpr::Expr(expr) = &container.expr {
                                            props_prop_expr = Some(expr.clone());
                                        }
                                    }
                                    continue;
                                }
                                "mediaQueries" => {
                                    // Consumed by extractor, skip (Phase 5 concern)
                                    continue;
                                }
                                _ => {
                                    // Other skipped props shouldn't reach here
                                    continue;
                                }
                            }
                        }

                        // Handle className/class prop -- extract for combining
                        if attr_name == "className" || attr_name == "class" {
                            match &jsx_attr.value {
                                Some(JSXAttrValue::Str(s)) => {
                                    let val = atom_to_string(&s.value);
                                    if !val.is_empty() {
                                        existing_class_value = Some(val);
                                    }
                                }
                                Some(JSXAttrValue::JSXExprContainer(container)) => {
                                    match &container.expr {
                                        JSXExpr::Expr(expr) => {
                                            if let Some(StaticValue::String(s)) =
                                                evaluate_expr(expr, &self.const_bindings)
                                            {
                                                if !s.is_empty() {
                                                    existing_class_value = Some(s);
                                                }
                                            } else {
                                                // Non-static className -- store expr for runtime combining
                                                existing_class_expr = Some(expr.clone());
                                            }
                                        }
                                        _ => {
                                            remaining_attrs.push(attr);
                                        }
                                    }
                                }
                                _ => {
                                    remaining_attrs.push(attr);
                                }
                            }
                            continue;
                        }

                        // All other component props pass through to the output element
                        remaining_attrs.push(attr);
                        continue;
                    }

                    // This is a style prop -- try to evaluate and extract.
                    // Check for ternary/logical expressions BEFORE static evaluation.
                    let expr_value = match &jsx_attr.value {
                        Some(JSXAttrValue::Str(s)) => Some(StyleValue::Primitive(
                            StaticValue::String(atom_to_string(&s.value)),
                        )),
                        Some(JSXAttrValue::JSXExprContainer(container)) => match &container.expr {
                            JSXExpr::Expr(expr) => {
                                // Check for ternary/logical first
                                let is_ternary = matches!(
                                    expr.as_ref(),
                                    swc_core::ecma::ast::Expr::Cond(_)
                                ) || matches!(expr.as_ref(), swc_core::ecma::ast::Expr::Bin(bin)
                                        if bin.op == BinaryOp::LogicalAnd
                                        || bin.op == BinaryOp::LogicalOr
                                        || bin.op == BinaryOp::NullishCoalescing);

                                if is_ternary {
                                    // Unextractable branch -> None
                                    get_style_value(expr, &self.const_bindings).ok()
                                } else {
                                    evaluate_expr(expr, &self.const_bindings)
                                        .map(StyleValue::Primitive)
                                }
                            }
                            JSXExpr::JSXEmptyExpr(_) => None,
                        },
                        None => {
                            // Boolean attribute (e.g., <Block hidden />)
                            // Not a valid CSS value -- pass through as component prop
                            remaining_attrs.push(attr);
                            continue;
                        }
                        _ => {
                            // JSXElement or JSXFragment values -- pass through
                            remaining_attrs.push(attr);
                            continue;
                        }
                    };

                    match expr_value {
                        Some(StyleValue::Ternary {
                            test,
                            consequent,
                            alternate,
                        }) => {
                            // Check for useMatchMedia ternary interception:
                            // If the test is an Ident matching a media query key, route to @media CSS
                            let mut handled_as_media_query = false;
                            if let swc_core::ecma::ast::Expr::Ident(ref test_ident) = *test {
                                if let Some(mq) =
                                    self.media_queries_by_key.get(test_ident.sym.as_ref())
                                {
                                    // Babel routes consequent to @media (truthy = matches)
                                    // and alternate to base (falsy = doesn't match).
                                    // In the normalized form: consequent = truthy, alternate = falsy
                                    // So: consequent -> @media, alternate -> base
                                    let base_value = match *alternate {
                                        StyleValue::Primitive(ref v) => Some(v.clone()),
                                        _ => None,
                                    };
                                    let media_value = match *consequent {
                                        StyleValue::Primitive(ref v) => Some(v.clone()),
                                        _ => None,
                                    };

                                    if let (Some(base_val), Some(media_val)) =
                                        (base_value, media_value)
                                    {
                                        let mq_string = format!("@media {}", mq);
                                        // Add base style entry (no query)
                                        let base_entries = Self::collect_style_entries(
                                            &attr_name, &base_val, None, None,
                                        );
                                        for entry in base_entries {
                                            collected_style_props
                                                .insert(entry.dedup_key.clone(), entry);
                                        }
                                        // Add @media style entry
                                        let media_entries = Self::collect_style_entries(
                                            &attr_name,
                                            &media_val,
                                            Some(&mq_string),
                                            None,
                                        );
                                        for entry in media_entries {
                                            collected_style_props
                                                .insert(entry.dedup_key.clone(), entry);
                                        }
                                        handled_as_media_query = true;
                                    }
                                }
                            }

                            if !handled_as_media_query {
                                // Route to style tree for ternary grouping
                                let sv = StyleValue::Ternary {
                                    test,
                                    consequent,
                                    alternate,
                                };
                                update_style_tree(&mut style_tree, &attr_name, sv);
                            }
                        }
                        Some(StyleValue::Primitive(value)) => {
                            // Check for animation object syntax before collect_style_entries
                            let parsed = parse_prop_name(&attr_name);
                            if parsed.css_prop_name == "animation" {
                                if let StaticValue::Object(ref obj) = value {
                                    if let Some(class_name) =
                                        self.emit_animation_css(obj, &parsed, None)
                                    {
                                        class_names.push(class_name);
                                    }
                                    // Animation handled (or failed gracefully), skip
                                    continue;
                                }
                            }

                            // Collect entries for deferred processing (allows later props to override)
                            let entries =
                                Self::collect_style_entries(&attr_name, &value, None, None);
                            for entry in entries {
                                collected_style_props.insert(entry.dedup_key.clone(), entry);
                            }
                        }
                        None => {
                            // Could not evaluate statically -- this is unextractable
                            // Report diagnostic in noRuntime mode with prop name, component, expression, and location
                            if self.no_runtime != NoRuntimeMode::Off {
                                let expr_source = match &jsx_attr.value {
                                    Some(JSXAttrValue::JSXExprContainer(container)) => {
                                        match &container.expr {
                                            JSXExpr::Expr(expr) => expr_to_grouping_key(expr),
                                            _ => "<unknown>".to_string(),
                                        }
                                    }
                                    _ => "<unknown>".to_string(),
                                };
                                let location = self.format_location(jsx_attr.span);
                                self.report_diagnostic(&format!(
                                    "noRuntime: prop \"{}\" on <{}> could not be extracted: {{{}}} {}",
                                    attr_name, component_name, expr_source, location
                                ));
                            }
                            // Set runtime_required and keep the attr on the element
                            runtime_required = true;
                            remaining_attrs.push(attr);
                        }
                    }
                }
                JSXAttrOrSpread::SpreadElement(spread) => {
                    // Try to evaluate the spread expression to detect @media/@container/ampersand props.
                    // In jsxstyle, these are passed as JSX spread attributes:
                    //   <Block {...{"@media (min-width: 800px)": { color: "red" }}} />
                    //   <Block {...{"& > span": { color: "blue" }}} />
                    if let Some(StaticValue::Object(spread_obj)) =
                        evaluate_expr(&spread.expr, &self.const_bindings)
                    {
                        let fully_extracted = self.process_spread_styles(
                            &spread_obj,
                            &mut class_names,
                            &mut collected_style_props,
                        );
                        if !fully_extracted {
                            runtime_required = true;
                            remaining_attrs.push(attr);
                        }
                    } else {
                        // Spread expression is not statically evaluatable -- pass through
                        remaining_attrs.push(attr);
                    }
                }
            }
        }

        // Process collected style props in order, generating CSS for each unique entry.
        // Later props with the same dedup key have already overwritten earlier ones.
        for entry in collected_style_props.values() {
            if let Some(class_name) = self.emit_css_for_entry(entry) {
                class_names.push(class_name);
            } else if matches!(entry.value, StaticValue::Object(_)) {
                // Safety net: if emit_css_for_entry returns None for an Object value,
                // it means we have an unhandled object type (animation objects are handled
                // earlier). This must trigger runtime fallback rather than silently dropping.
                runtime_required = true;
            }
        }

        // Process style tree (ternary conditional style props).
        // Convert to ClassNameParts, generating CSS for leaf values along the way.
        let has_ternary_styles = !style_tree.styles.is_empty() || !style_tree.ternaries.is_empty();
        let ternary_class_parts = if has_ternary_styles {
            // Build a mutable closure that routes to either class_name_gen or class_name_fn
            let mut gen_fn = |key: &str| -> String {
                if let Some(ref mut gen) = self.class_name_gen {
                    gen.get_class_name(key)
                } else {
                    (self.class_name_fn)(key)
                }
            };
            convert_style_tree_to_class_parts(
                &style_tree,
                &mut self.class_name_cache,
                &mut self.css_rules,
                &mut gen_fn,
            )
        } else {
            Vec::new()
        };

        // Check if we have any ternary parts (not just static)
        let has_ternary_parts = ternary_class_parts
            .iter()
            .any(|p| matches!(p, ClassNamePart::Ternary { .. }));

        // Add props prop as spread or preserve as `props` attr for runtime Box
        if let Some(props_expr) = props_prop_expr {
            if runtime_required {
                // Box handles `props` at runtime -- preserve as props={...} attribute
                use swc_core::ecma::ast::*;
                remaining_attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr {
                    span: DUMMY_SP,
                    name: JSXAttrName::Ident(IdentName::new("props".into(), DUMMY_SP)),
                    value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
                        span: DUMMY_SP,
                        expr: JSXExpr::Expr(props_expr),
                    })),
                }));
            } else {
                remaining_attrs.push(props_to_spread(props_expr));
            }
        }

        // Build the className attribute combining existing + extracted class names
        if let Some(class_attr) = build_output_class_name(
            self.class_prop_name,
            &class_names,
            ternary_class_parts,
            has_ternary_parts,
            existing_class_value,
            existing_class_expr,
        ) {
            remaining_attrs.push(class_attr);
        }

        // Determine the output element name
        let original_span = match &element.opening.name {
            JSXElementName::Ident(id) => id.span,
            _ => DUMMY_SP,
        };

        let new_element_name = if runtime_required {
            // Runtime required: rename to Box (not div), keep unextractable props
            self.needs_box_import = true;
            // Re-emit component prop so Box knows which element to render
            if let Some(comp_attr) = component_prop_attr {
                remaining_attrs.push(comp_attr);
            }
            build_runtime_element_name(original_span)
        } else {
            // Build element name from component prop or default to "div"
            build_element_name(component_prop_value.as_deref(), original_span)
        };

        element.opening.name = new_element_name;
        element.opening.attrs = remaining_attrs;

        // Update closing element name to match
        if let Some(closing) = &mut element.closing {
            closing.name = element.opening.name.clone();
        }
    }
}

/// Inject a `{ Box as _Box }` import specifier into the existing jsxstyle import.
///
/// Per the Babel extractor, Box is always injected when runtime is required
/// so unextractable elements can fall back to the Box runtime component.
/// Resolve external bindings from dependency modules into the const_bindings map.
///
/// Walks all ImportDecl items in the module and, for each import specifier,
/// looks up the corresponding export in `external_bindings`. If found,
/// inserts the value into `const_bindings` with the local binding's Id.
fn resolve_external_bindings(
    module: &Module,
    external_bindings: &std::collections::HashMap<
        String,
        std::collections::HashMap<String, StaticValue>,
    >,
    const_bindings: &mut FxHashMap<Id, StaticValue>,
) {
    use swc_core::ecma::ast::ImportSpecifier;

    for item in &module.body {
        let import_decl = match item {
            ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)) => import_decl,
            _ => continue,
        };

        let source_str = match import_decl.src.value.as_str() {
            Some(s) => s,
            None => continue,
        };

        let module_exports = match external_bindings.get(source_str) {
            Some(exports) => exports,
            None => continue,
        };

        for specifier in &import_decl.specifiers {
            match specifier {
                // import { X } from './tokens' or import { X as Y } from './tokens'
                ImportSpecifier::Named(named) => {
                    let exported_name = match &named.imported {
                        Some(swc_core::ecma::ast::ModuleExportName::Ident(id)) => {
                            id.sym.as_ref().to_string()
                        }
                        Some(swc_core::ecma::ast::ModuleExportName::Str(s)) => {
                            atom_to_string(&s.value)
                        }
                        None => named.local.sym.as_ref().to_string(),
                    };

                    if let Some(value) = module_exports.get(&exported_name) {
                        const_bindings.insert(named.local.to_id(), value.clone());
                    }
                }
                // import X from './tokens' → look up "default"
                ImportSpecifier::Default(default_import) => {
                    if let Some(value) = module_exports.get("default") {
                        const_bindings.insert(default_import.local.to_id(), value.clone());
                    }
                }
                // import * as X from './tokens' → insert as Object
                ImportSpecifier::Namespace(ns) => {
                    let obj: IndexMap<String, StaticValue> = module_exports
                        .iter()
                        .map(|(k, v)| (k.clone(), v.clone()))
                        .collect();
                    if !obj.is_empty() {
                        const_bindings.insert(ns.local.to_id(), StaticValue::Object(obj));
                    }
                }
            }
        }
    }
}

fn inject_box_import(module: &mut Module, import_decl_index: usize, _source: &str) {
    use swc_core::ecma::ast::{ImportNamedSpecifier, ImportSpecifier, ModuleExportName};

    debug_assert!(
        import_decl_index < module.body.len(),
        "inject_box_import: import_decl_index {} out of bounds (module.body.len() = {})",
        import_decl_index,
        module.body.len()
    );

    if let Some(ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl))) =
        module.body.get_mut(import_decl_index)
    {
        // Add Box import specifier to the existing import declaration
        import_decl
            .specifiers
            .push(ImportSpecifier::Named(ImportNamedSpecifier {
                span: DUMMY_SP,
                local: Ident::new("Box".into(), DUMMY_SP, Default::default()),
                imported: Some(ModuleExportName::Ident(Ident::new(
                    "Box".into(),
                    DUMMY_SP,
                    Default::default(),
                ))),
                is_type_only: false,
            }));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use swc_core::common::input::StringInput;
    use swc_core::common::sync::Lrc;
    use swc_core::common::{FileName, Mark, SourceMap, GLOBALS};
    use swc_core::ecma::parser::lexer::Lexer;
    use swc_core::ecma::parser::{Parser, Syntax, TsSyntax};
    use swc_core::ecma::visit::VisitMutWith;

    /// Helper: transform source with noRuntime mode, collecting error messages
    /// via the visitor's errors vector.
    fn transform_with_no_runtime(source: &str) -> Vec<String> {
        GLOBALS.set(&Default::default(), || {
            let cm: Lrc<SourceMap> = Lrc::new(SourceMap::default());
            let fm = cm.new_source_file(
                FileName::Custom("test.tsx".to_string()).into(),
                source.to_string(),
            );

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
            let mut module = parser.parse_module().unwrap();

            let unresolved_mark = Mark::new();
            let top_level_mark = Mark::new();
            module.visit_mut_with(&mut swc_core::ecma::transforms::base::resolver(
                unresolved_mark,
                top_level_mark,
                true,
            ));

            let mut visitor = TransformVisitor {
                no_runtime: NoRuntimeMode::Error,
                ..Default::default()
            };
            module.visit_mut_with(&mut visitor);

            visitor.errors
        })
    }

    #[test]
    fn test_no_runtime_static_props_no_errors() {
        let errors = transform_with_no_runtime(
            r#"import { Block } from "@jsxstyle/react";
<Block color="red" width={200} />;"#,
        );
        assert!(
            errors.is_empty(),
            "Static props should not trigger noRuntime errors"
        );
    }

    #[test]
    fn test_no_runtime_unextractable_prop_reports_error() {
        let errors = transform_with_no_runtime(
            r#"import { Block } from "@jsxstyle/react";
declare const wow: string;
<Block color={wow} />;"#,
        );
        assert_eq!(errors.len(), 1, "Expected 1 error: per-prop diagnostic");
        assert!(
            errors[0].contains("noRuntime: prop \"color\" on <Block> could not be extracted"),
            "Error should use enriched format"
        );
        assert!(
            errors[0].contains("{wow}"),
            "Error should include expression source in braces"
        );
    }

    #[test]
    fn test_no_runtime_ternary_static_branches_no_error() {
        let errors = transform_with_no_runtime(
            r#"import { Block } from "@jsxstyle/react";
declare const cond: boolean;
<Block color={cond ? "red" : "blue"} />;"#,
        );
        assert!(
            errors.is_empty(),
            "Ternary with static branches should not trigger noRuntime errors"
        );
    }

    #[test]
    fn test_no_runtime_logical_and_static_no_error() {
        let errors = transform_with_no_runtime(
            r#"import { Block } from "@jsxstyle/react";
declare const cond: boolean;
<Block color={cond && "red"} />;"#,
        );
        assert!(
            errors.is_empty(),
            "Logical AND with static value should not trigger noRuntime errors"
        );
    }

    /// Helper: transform source with external bindings, collecting CSS output
    fn transform_with_external_bindings(
        source: &str,
        external_bindings: std::collections::HashMap<
            String,
            std::collections::HashMap<String, StaticValue>,
        >,
    ) -> (String, String) {
        GLOBALS.set(&Default::default(), || {
            let cm: Lrc<SourceMap> = Lrc::new(SourceMap::default());
            let fm = cm.new_source_file(
                FileName::Custom("test.tsx".to_string()).into(),
                source.to_string(),
            );

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
            let mut module = parser.parse_module().unwrap();

            let unresolved_mark = Mark::new();
            let top_level_mark = Mark::new();
            module.visit_mut_with(&mut swc_core::ecma::transforms::base::resolver(
                unresolved_mark,
                top_level_mark,
                true,
            ));

            let mut visitor = TransformVisitor {
                external_bindings,
                ..Default::default()
            };
            module.visit_mut_with(&mut visitor);

            let css = visitor.get_css();

            // Codegen
            use swc_core::ecma::codegen::text_writer::JsWriter;
            use swc_core::ecma::codegen::Emitter;
            let mut buf = Vec::new();
            {
                let mut emitter = Emitter {
                    cfg: swc_core::ecma::codegen::Config::default()
                        .with_minify(false)
                        .with_ascii_only(false),
                    cm: cm.clone(),
                    comments: None,
                    wr: JsWriter::new(cm.clone(), "\n", &mut buf, None),
                };
                emitter.emit_module(&module).unwrap();
            }
            let code = String::from_utf8(buf).unwrap();
            (code, css)
        })
    }

    #[test]
    fn test_external_bindings_named_import() {
        let mut ext = std::collections::HashMap::new();
        let mut tokens = std::collections::HashMap::new();
        tokens.insert("SPACING".to_string(), StaticValue::Number(8.0));
        tokens.insert(
            "PRIMARY".to_string(),
            StaticValue::String("#007bff".to_string()),
        );
        ext.insert("./tokens".to_string(), tokens);

        let (code, css) = transform_with_external_bindings(
            r#"import { SPACING, PRIMARY } from './tokens';
import { Block } from "@jsxstyle/react";
<Block padding={SPACING} color={PRIMARY} />;"#,
            ext,
        );

        // CSS should contain extracted styles
        assert!(
            css.contains("padding:8px"),
            "CSS should contain padding:8px, got: {css}"
        );
        assert!(
            css.contains("color:#007bff"),
            "CSS should contain color:#007bff, got: {css}"
        );

        // Code should NOT contain SPACING or PRIMARY as runtime props
        assert!(
            !code.contains("padding={SPACING}"),
            "padding should be extracted, not runtime"
        );
        assert!(
            !code.contains("color={PRIMARY}"),
            "color should be extracted, not runtime"
        );
    }

    #[test]
    fn test_external_bindings_default_import() {
        let mut ext = std::collections::HashMap::new();
        let mut module_exports = std::collections::HashMap::new();
        let mut theme_obj = IndexMap::new();
        theme_obj.insert(
            "color".to_string(),
            StaticValue::String("var(--color)".to_string()),
        );
        module_exports.insert("default".to_string(), StaticValue::Object(theme_obj));
        ext.insert("./theme".to_string(), module_exports);

        let (_code, css) = transform_with_external_bindings(
            r#"import theme from './theme';
import { Block } from "@jsxstyle/react";
<Block color={theme.color} />;"#,
            ext,
        );

        assert!(
            css.contains("color:var(--color)"),
            "CSS should resolve member expression, got: {css}"
        );
    }

    #[test]
    fn test_external_bindings_renamed_import() {
        let mut ext = std::collections::HashMap::new();
        let mut tokens = std::collections::HashMap::new();
        tokens.insert("SPACING".to_string(), StaticValue::Number(16.0));
        ext.insert("./tokens".to_string(), tokens);

        let (_code, css) = transform_with_external_bindings(
            r#"import { SPACING as gap } from './tokens';
import { Block } from "@jsxstyle/react";
<Block padding={gap} />;"#,
            ext,
        );

        assert!(
            css.contains("padding:16px"),
            "Renamed import should resolve, got: {css}"
        );
    }

    #[test]
    fn test_external_bindings_no_jsxstyle_still_collects_exports() {
        // Files without jsxstyle imports should still collect static exports
        GLOBALS.set(&Default::default(), || {
            let cm: Lrc<SourceMap> = Lrc::new(SourceMap::default());
            let fm = cm.new_source_file(
                FileName::Custom("tokens.ts".to_string()).into(),
                "export const SPACING = 8; export const COLOR = 'red';".to_string(),
            );

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
            let mut module = parser.parse_module().unwrap();

            let unresolved_mark = Mark::new();
            let top_level_mark = Mark::new();
            module.visit_mut_with(&mut swc_core::ecma::transforms::base::resolver(
                unresolved_mark,
                top_level_mark,
                true,
            ));

            let mut visitor = TransformVisitor::default();
            module.visit_mut_with(&mut visitor);

            let exports = visitor.get_static_exports();
            assert_eq!(exports.get("SPACING"), Some(&StaticValue::Number(8.0)));
            assert_eq!(
                exports.get("COLOR"),
                Some(&StaticValue::String("red".to_string()))
            );
        });
    }
}
