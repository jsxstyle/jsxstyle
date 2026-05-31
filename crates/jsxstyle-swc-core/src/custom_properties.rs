//! makeCustomProperties chain extraction for jsxstyle.
//!
//! Ports the Babel extractor's makeCustomProperties handling:
//! - Walks makeCustomProperties().addVariant().build() call chains
//! - Statically evaluates all arguments
//! - Generates CSS custom property rules via generate_custom_properties_from_variants
//! - Replaces the chain expression with a static object literal

use rustc_hash::FxHashMap;

use indexmap::IndexMap;
use swc_core::common::DUMMY_SP;
use swc_core::ecma::ast::{
    ArrayLit, Callee, Expr, ExprOrSpread, Id, IdentName, KeyValueProp, Lit, MemberProp, Module,
    ObjectLit, Prop, PropName, PropOrSpread, Str, VarDeclarator,
};
use swc_core::ecma::visit::{VisitMut, VisitMutWith};

use crate::css_gen::radix_36;
use crate::dangerous_style_value::dangerous_style_value;
use crate::import_tracker::NonComponentImportEntry;
use crate::static_eval::evaluate_expr;
use crate::types::{CssRule, StaticValue};

// ─── Types ───────────────────────────────────────────────────────────

/// A variant entry extracted from a .addVariant() call.
struct VariantEntry {
    name: String,
    props: IndexMap<String, StaticValue>,
    options: Option<IndexMap<String, StaticValue>>,
}

/// A decomposed makeCustomProperties chain.
struct DecomposedChain {
    default_props: IndexMap<String, StaticValue>,
    default_options: Option<IndexMap<String, StaticValue>>,
    variants: Vec<VariantEntry>,
    build_options: Option<IndexMap<String, StaticValue>>,
}

/// A custom property variant in the output.
struct CustomPropertyVariant {
    class_name: String,
    media_query: Option<String>,
}

/// Result of generateCustomPropertiesFromVariants.
struct CustomPropertiesResult {
    /// Nested custom properties object: key -> "var(--...)" or nested object
    custom_properties: Vec<(String, CustomPropValue)>,
    /// Ordered variant names (including "default")
    variant_names: Vec<String>,
    /// Variant configs: name -> { className, mediaQuery? }
    variants: Vec<(String, CustomPropertyVariant)>,
    /// CSS rule strings in insertion order
    styles: Vec<String>,
}

/// A custom property value: either a var() reference or a nested object.
enum CustomPropValue {
    Var(String),
    Nested(Vec<(String, CustomPropValue)>),
}

// ─── Core generation logic (port of generateCustomPropertiesFromVariants.ts) ───

/// Walk the default variant's props recursively, building:
/// - prop_map: key_path -> CSS custom property name (e.g., "prop1" -> "--jsxstyle-prop1")
/// - custom_props: ordered list of (key, CustomPropValue) entries
/// - css_body: CSS declarations string
fn get_custom_props_from_default_variant(
    obj: &IndexMap<String, StaticValue>,
    namespace: &str,
    should_mangle: bool,
    mangle_index: &mut usize,
    prop_map: &mut FxHashMap<String, String>,
    key_prefix: &str,
) -> (Vec<(String, CustomPropValue)>, String) {
    let mut custom_props: Vec<(String, CustomPropValue)> = Vec::new();
    let mut css_body = String::new();

    for (key, value) in obj {
        // Skip mediaQuery and colorScheme at top level
        if key_prefix.is_empty() && (key == "mediaQuery" || key == "colorScheme") {
            continue;
        }

        let key_plus_prefix = if key_prefix.is_empty() {
            key.clone()
        } else {
            format!("{key_prefix}-{key}")
        };

        match value {
            StaticValue::String(_) | StaticValue::Number(_) => {
                let prop = if should_mangle {
                    let idx = *mangle_index;
                    *mangle_index += 1;
                    radix_36(idx as u32)
                } else {
                    format!("-{key_plus_prefix}")
                };
                let ns = if namespace.is_empty() {
                    "jsxstyle"
                } else {
                    namespace
                };
                let css_prop_name = format!("--{ns}{prop}");
                prop_map.insert(key_plus_prefix.clone(), css_prop_name.clone());
                custom_props.push((
                    key.clone(),
                    CustomPropValue::Var(format!("var({css_prop_name})")),
                ));
                if let Some(formatted) = dangerous_style_value("", value) {
                    css_body.push_str(&format!("{css_prop_name}:{formatted};"));
                }
            }
            StaticValue::Object(nested_obj) => {
                let (nested_props, nested_css) = get_custom_props_from_default_variant(
                    nested_obj,
                    namespace,
                    should_mangle,
                    mangle_index,
                    prop_map,
                    &key_plus_prefix,
                );
                custom_props.push((key.clone(), CustomPropValue::Nested(nested_props)));
                css_body.push_str(&nested_css);
            }
            _ => {
                // Skip non-string/number/object values
            }
        }
    }

    (custom_props, css_body)
}

/// Walk a non-default variant's props, using prop_map from the default variant.
fn get_custom_props_from_variant(
    obj: &IndexMap<String, StaticValue>,
    prop_map: &FxHashMap<String, String>,
    key_prefix: &str,
) -> String {
    let mut css = String::new();

    for (key, value) in obj {
        let key_plus_prefix = if key_prefix.is_empty() {
            key.clone()
        } else {
            format!("{key_prefix}-{key}")
        };

        match value {
            StaticValue::String(_) | StaticValue::Number(_) => {
                if let Some(prop_name) = prop_map.get(&key_plus_prefix) {
                    if let Some(formatted) = dangerous_style_value("", value) {
                        if !formatted.is_empty() {
                            css.push_str(&format!("{prop_name}:{formatted};"));
                        }
                    }
                }
            }
            StaticValue::Object(nested_obj) => {
                css.push_str(&get_custom_props_from_variant(
                    nested_obj,
                    prop_map,
                    &key_plus_prefix,
                ));
            }
            _ => {}
        }
    }

    css
}

/// Port of generateCustomPropertiesFromVariants from TypeScript.
fn generate_custom_properties_from_variants(
    default_props: &IndexMap<String, StaticValue>,
    default_options: Option<&IndexMap<String, StaticValue>>,
    variants: &[VariantEntry],
    build_options: Option<&IndexMap<String, StaticValue>>,
) -> CustomPropertiesResult {
    // Extract build options
    let namespace = build_options
        .and_then(|o| o.get("namespace"))
        .and_then(|v| match v {
            StaticValue::String(s) => Some(s.as_str()),
            _ => None,
        })
        .unwrap_or("jsxstyle");

    let selector = build_options
        .and_then(|o| o.get("selector"))
        .and_then(|v| match v {
            StaticValue::String(s) => Some(s.as_str()),
            _ => None,
        })
        .unwrap_or(":root");

    let mangle = build_options
        .and_then(|o| o.get("mangle"))
        .and_then(|v| match v {
            StaticValue::Bool(b) => Some(*b),
            _ => None,
        })
        .unwrap_or(false);

    let override_class_name_prefix = format!("{namespace}_");

    // Process default variant
    let mut mangle_index: usize = 0;
    let mut prop_map: FxHashMap<String, String> = FxHashMap::default();
    let (custom_props, css) = get_custom_props_from_default_variant(
        default_props,
        namespace,
        mangle,
        &mut mangle_index,
        &mut prop_map,
        "",
    );

    // Build default CSS body with optional colorScheme prefix
    let color_scheme_prefix = default_options
        .and_then(|o| o.get("colorScheme"))
        .and_then(|v| match v {
            StaticValue::String(s) => Some(format!("color-scheme:{s};")),
            _ => None,
        })
        .unwrap_or_default();

    let default_css_body = format!("{color_scheme_prefix}{css}");
    // Remove trailing semicolon (matching JS `.slice(0, -1)`)
    let default_css = if default_css_body.ends_with(';') {
        &default_css_body[..default_css_body.len() - 1]
    } else {
        &default_css_body
    };

    let default_media_query =
        default_options
            .and_then(|o| o.get("mediaQuery"))
            .and_then(|v| match v {
                StaticValue::String(s) => Some(format!("@media {s}")),
                _ => None,
            });

    let mut styles: Vec<String> = Vec::new();
    styles.push(format!("{selector}{{{default_css}}}"));
    styles.push(format!(
        "{selector}:not(.\\9).{override_class_name_prefix}default{{{default_css}}}"
    ));
    if let Some(ref mq) = default_media_query {
        styles.push(format!("{mq}{{{selector}:not(.\\9){{{default_css}}}}}"));
    }

    let mut variant_names: Vec<String> = vec!["default".to_string()];
    let mut variant_configs: Vec<(String, CustomPropertyVariant)> = vec![(
        "default".to_string(),
        CustomPropertyVariant {
            class_name: format!("{override_class_name_prefix}default"),
            media_query: default_media_query,
        },
    )];

    // Process non-default variants
    for variant in variants {
        variant_names.push(variant.name.clone());

        let mut css_body = get_custom_props_from_variant(&variant.props, &prop_map, "");

        // Handle colorScheme option
        if let Some(ref opts) = variant.options {
            if let Some(StaticValue::String(cs)) = opts.get("colorScheme") {
                // dangerousStyleValue for colorScheme
                let cs_val = dangerous_style_value("colorScheme", &StaticValue::String(cs.clone()));
                if let Some(cs_formatted) = cs_val {
                    css_body = format!("color-scheme:{cs_formatted};{css_body}");
                }
            }
        }

        // Remove trailing semicolon
        let css_trimmed = if css_body.ends_with(';') {
            &css_body[..css_body.len() - 1]
        } else {
            &css_body
        };

        let override_class_name = format!("{override_class_name_prefix}{}", variant.name);

        let mut variant_obj = CustomPropertyVariant {
            class_name: override_class_name.clone(),
            media_query: None,
        };

        styles.push(format!(
            "{selector}:not(.\\9).{override_class_name}{{{css_trimmed}}}"
        ));

        if let Some(ref opts) = variant.options {
            if let Some(StaticValue::String(mq)) = opts.get("mediaQuery") {
                let media_query = format!("@media {mq}");
                variant_obj.media_query = Some(media_query.clone());
                styles.push(format!(
                    "{media_query}{{{selector}:not(.\\9){{{css_trimmed}}}}}"
                ));
            }
        }

        variant_configs.push((variant.name.clone(), variant_obj));
    }

    CustomPropertiesResult {
        custom_properties: custom_props,
        variant_names,
        variants: variant_configs,
        styles,
    }
}

// ─── Chain decomposition ─────────────────────────────────────────────

/// Decompose a makeCustomProperties().addVariant().build() chain expression.
///
/// The AST structure for `makeCustomProperties({}).addVariant('x', {}).build()`:
/// ```text
/// CallExpr(.build)
///   callee: MemberExpr
///     obj: CallExpr(.addVariant)
///       callee: MemberExpr
///         obj: CallExpr(makeCustomProperties)
///         prop: Ident("addVariant")
///       args: [name, props, ?options]
///     prop: Ident("build")
///   args: [?buildOptions]
/// ```
fn decompose_chain(
    expr: &Expr,
    mcp_imports: &[&NonComponentImportEntry],
    bindings: &FxHashMap<Id, StaticValue>,
) -> Option<DecomposedChain> {
    // Must be a CallExpr
    let call = match expr {
        Expr::Call(c) => c,
        _ => return None,
    };

    // Callee must be a MemberExpr with .build
    let member = match &call.callee {
        Callee::Expr(e) => match e.as_ref() {
            Expr::Member(m) => m,
            // Direct call to makeCustomProperties() without .build() -- not a complete chain
            _ => return None,
        },
        _ => return None,
    };

    let method_name = match &member.prop {
        MemberProp::Ident(id) => id.sym.as_ref(),
        _ => return None,
    };

    if method_name != "build" {
        return None;
    }

    // Extract build options (optional first argument)
    let build_options = if !call.args.is_empty() {
        match evaluate_expr(&call.args[0].expr, bindings)? {
            StaticValue::Object(obj) => Some(obj),
            _ => return None,
        }
    } else {
        None
    };

    // Recurse into the inner chain (obj of the MemberExpr)
    let mut variants: Vec<VariantEntry> = Vec::new();
    let (default_props, default_options) =
        decompose_inner_chain(&member.obj, mcp_imports, bindings, &mut variants)?;

    Some(DecomposedChain {
        default_props,
        default_options,
        variants,
        build_options,
    })
}

/// Recursively decompose the inner part of a chain (addVariant calls and the base makeCustomProperties call).
#[allow(clippy::type_complexity)]
fn decompose_inner_chain(
    expr: &Expr,
    mcp_imports: &[&NonComponentImportEntry],
    bindings: &FxHashMap<Id, StaticValue>,
    variants: &mut Vec<VariantEntry>,
) -> Option<(
    IndexMap<String, StaticValue>,
    Option<IndexMap<String, StaticValue>>,
)> {
    let call = match expr {
        Expr::Call(c) => c,
        _ => return None,
    };

    match &call.callee {
        Callee::Expr(callee_expr) => {
            match callee_expr.as_ref() {
                // Base case: makeCustomProperties(defaults, ?options)
                Expr::Ident(id) => {
                    let is_mcp = mcp_imports.iter().any(|entry| {
                        entry.local_sym == id.sym.as_ref() && entry.local_ctxt == id.ctxt
                    });
                    if !is_mcp {
                        return None;
                    }

                    // Extract default props (first argument, required)
                    if call.args.is_empty() {
                        return None;
                    }
                    let default_props = match evaluate_expr(&call.args[0].expr, bindings)? {
                        StaticValue::Object(obj) => obj,
                        _ => return None,
                    };

                    // Extract default options (second argument, optional)
                    let default_options = if call.args.len() > 1 {
                        match evaluate_expr(&call.args[1].expr, bindings)? {
                            StaticValue::Object(obj) => Some(obj),
                            _ => None,
                        }
                    } else {
                        None
                    };

                    Some((default_props, default_options))
                }

                // Recursive case: .addVariant() or unknown method
                Expr::Member(member) => {
                    let method_name = match &member.prop {
                        MemberProp::Ident(id) => id.sym.as_ref().to_string(),
                        _ => return None,
                    };

                    if method_name == "addVariant" {
                        // addVariant(name, props, ?options)
                        if call.args.len() < 2 {
                            return None;
                        }

                        let name = match evaluate_expr(&call.args[0].expr, bindings)? {
                            StaticValue::String(s) => s,
                            _ => return None,
                        };

                        let props = match evaluate_expr(&call.args[1].expr, bindings)? {
                            StaticValue::Object(obj) => obj,
                            _ => return None,
                        };

                        let options = if call.args.len() > 2 {
                            match evaluate_expr(&call.args[2].expr, bindings)? {
                                StaticValue::Object(obj) => Some(obj),
                                _ => None,
                            }
                        } else {
                            None
                        };

                        // Recurse first to get inner chain, then add this variant
                        let result =
                            decompose_inner_chain(&member.obj, mcp_imports, bindings, variants)?;

                        variants.push(VariantEntry {
                            name,
                            props,
                            options,
                        });

                        Some(result)
                    } else {
                        // Unknown method -- bail out silently
                        None
                    }
                }

                _ => None,
            }
        }
        _ => None,
    }
}

// ─── AST construction ────────────────────────────────────────────────

/// Build a replacement object literal expression from the CustomPropertiesResult.
///
/// The output matches the Babel extractor's object structure:
/// ```js
/// {
///   prop1: "var(--jsxstyle-prop1)",
///   prop2: "var(--jsxstyle-prop2)",
///   variantNames: ["default", "banana"],
///   variants: { default: { className: "jsxstyle_default" }, ... },
///   styles: [":root{...}", ...]
/// }
/// ```
fn build_replacement_expr(result: &CustomPropertiesResult) -> Expr {
    let mut props: Vec<PropOrSpread> = Vec::new();

    // Custom property entries (recursively)
    build_custom_prop_entries(&result.custom_properties, &mut props);

    // variantNames array
    props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
        key: PropName::Ident(IdentName::new("variantNames".into(), DUMMY_SP)),
        value: Box::new(Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: result
                .variant_names
                .iter()
                .map(|name| {
                    Some(ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: name.as_str().into(),
                            raw: None,
                        }))),
                    })
                })
                .collect(),
        })),
    }))));

    // variants object
    let variant_props: Vec<PropOrSpread> = result
        .variants
        .iter()
        .map(|(name, variant)| {
            let mut variant_obj_props: Vec<PropOrSpread> = Vec::new();

            // className property
            variant_obj_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Ident(IdentName::new("className".into(), DUMMY_SP)),
                value: Box::new(Expr::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: variant.class_name.as_str().into(),
                    raw: None,
                }))),
            }))));

            // mediaQuery property (optional)
            if let Some(ref mq) = variant.media_query {
                variant_obj_props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(
                    KeyValueProp {
                        key: PropName::Ident(IdentName::new("mediaQuery".into(), DUMMY_SP)),
                        value: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: mq.as_str().into(),
                            raw: None,
                        }))),
                    },
                ))));
            }

            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                key: PropName::Ident(IdentName::new(name.as_str().into(), DUMMY_SP)),
                value: Box::new(Expr::Object(ObjectLit {
                    span: DUMMY_SP,
                    props: variant_obj_props,
                })),
            })))
        })
        .collect();

    props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
        key: PropName::Ident(IdentName::new("variants".into(), DUMMY_SP)),
        value: Box::new(Expr::Object(ObjectLit {
            span: DUMMY_SP,
            props: variant_props,
        })),
    }))));

    // styles array
    // The styles strings contain `:not(.\9)` which in a JS string literal must be `":not(.\\9)"`.
    // SWC's Str node: `value` is the semantic string content (with actual \9 tab char),
    // and `raw` controls what gets emitted. We set `value` to the string with literal `\9`
    // (backslash + 9) and let SWC handle escaping via raw.
    props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
        key: PropName::Ident(IdentName::new("styles".into(), DUMMY_SP)),
        value: Box::new(Expr::Array(ArrayLit {
            span: DUMMY_SP,
            elems: result
                .styles
                .iter()
                .map(|style| {
                    // The style string contains `\9` (backslash + 9).
                    // In the JS output, this needs to appear as `\\9` in the string literal.
                    // SWC's Str value is the semantic content. When value contains `\9`,
                    // the emitter will output `\\9` in the string literal. But we need
                    // to set raw to control exact output matching Babel.
                    //
                    // Babel outputs: ":root:not(.\\9).jsxstyle_default{...}"
                    // The `\\9` in the source means the JS string value has `\9` (backslash-nine).
                    //
                    // SWC Str.value should be the actual string content: with `\9` as tab character?
                    // No -- in Babel's output, `\\9` in a JS string literal means the string
                    // VALUE contains `\9` (literally backslash then 9), NOT a tab.
                    //
                    // So: style string = ":root:not(.\9).jsxstyle_default{...}" (with literal \9)
                    // JS output should be: ":root:not(.\\9).jsxstyle_default{...}" (escaped backslash)
                    //
                    // Set raw to force the exact string literal format.
                    let raw_str =
                        format!("\"{}\"", style.replace('\\', "\\\\").replace('"', "\\\""));
                    Some(ExprOrSpread {
                        spread: None,
                        expr: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: style.as_str().into(),
                            raw: Some(raw_str.into()),
                        }))),
                    })
                })
                .collect(),
        })),
    }))));

    Expr::Object(ObjectLit {
        span: DUMMY_SP,
        props,
    })
}

/// Recursively build object property entries from custom properties.
fn build_custom_prop_entries(
    custom_props: &[(String, CustomPropValue)],
    props: &mut Vec<PropOrSpread>,
) {
    for (key, value) in custom_props {
        match value {
            CustomPropValue::Var(var_ref) => {
                props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                    key: PropName::Ident(IdentName::new(key.as_str().into(), DUMMY_SP)),
                    value: Box::new(Expr::Lit(Lit::Str(Str {
                        span: DUMMY_SP,
                        value: var_ref.as_str().into(),
                        raw: None,
                    }))),
                }))));
            }
            CustomPropValue::Nested(nested) => {
                let mut nested_props: Vec<PropOrSpread> = Vec::new();
                build_custom_prop_entries(nested, &mut nested_props);
                props.push(PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                    key: PropName::Ident(IdentName::new(key.as_str().into(), DUMMY_SP)),
                    value: Box::new(Expr::Object(ObjectLit {
                        span: DUMMY_SP,
                        props: nested_props,
                    })),
                }))));
            }
        }
    }
}

// ─── Module-level processing ─────────────────────────────────────────

/// Process makeCustomProperties chain expressions in the module.
///
/// Walks module looking for VariableDeclarator where init is a complete
/// makeCustomProperties().addVariant().build() chain. For each match:
/// - Decomposes the chain to extract default props, variants, build options
/// - Calls generate_custom_properties_from_variants to produce CSS + result object
/// - Replaces the chain expression with the result object literal
/// - Pushes CSS rules to css_rules
pub fn process_custom_properties(
    module: &mut Module,
    mcp_imports: &[&NonComponentImportEntry],
    const_bindings: &FxHashMap<Id, StaticValue>,
    css_rules: &mut Vec<CssRule>,
) {
    let mut replacer = ChainReplacer {
        mcp_imports,
        const_bindings,
        css_rules,
    };
    module.visit_mut_with(&mut replacer);
}

/// VisitMut that finds and replaces makeCustomProperties chains.
struct ChainReplacer<'a> {
    mcp_imports: &'a [&'a NonComponentImportEntry],
    const_bindings: &'a FxHashMap<Id, StaticValue>,
    css_rules: &'a mut Vec<CssRule>,
}

impl VisitMut for ChainReplacer<'_> {
    fn visit_mut_var_declarator(&mut self, declarator: &mut VarDeclarator) {
        // Recurse first
        declarator.visit_mut_children_with(self);

        let init = match &declarator.init {
            Some(init) => init,
            None => return,
        };

        // Try to decompose as a makeCustomProperties chain
        let chain = match decompose_chain(init, self.mcp_imports, self.const_bindings) {
            Some(c) => c,
            None => return,
        };

        // Generate custom properties
        let result = generate_custom_properties_from_variants(
            &chain.default_props,
            chain.default_options.as_ref(),
            &chain.variants,
            chain.build_options.as_ref(),
        );

        // Push CSS rules (global custom property rules)
        for style in &result.styles {
            self.css_rules.push(CssRule {
                rule: style.clone(),
            });
        }

        // Replace the init expression with the result object literal
        let replacement = build_replacement_expr(&result);
        declarator.init = Some(Box::new(replacement));
    }

    // Also handle bare expression statements (not just var declarators)
    fn visit_mut_expr(&mut self, expr: &mut Expr) {
        // Recurse first
        expr.visit_mut_children_with(self);

        // Try to decompose as a chain
        let chain = match decompose_chain(expr, self.mcp_imports, self.const_bindings) {
            Some(c) => c,
            None => return,
        };

        let result = generate_custom_properties_from_variants(
            &chain.default_props,
            chain.default_options.as_ref(),
            &chain.variants,
            chain.build_options.as_ref(),
        );

        for style in &result.styles {
            self.css_rules.push(CssRule {
                rule: style.clone(),
            });
        }

        *expr = build_replacement_expr(&result);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_radix_36() {
        assert_eq!(radix_36(0), "0");
        assert_eq!(radix_36(1), "1");
        assert_eq!(radix_36(10), "a");
        assert_eq!(radix_36(35), "z");
        assert_eq!(radix_36(36), "10");
    }

    #[test]
    fn test_generate_basic() {
        let mut default_props = IndexMap::new();
        default_props.insert(
            "prop1".to_string(),
            StaticValue::String("prop1 value".to_string()),
        );
        default_props.insert("prop2".to_string(), StaticValue::Number(123.0));

        let mut banana_props = IndexMap::new();
        banana_props.insert(
            "prop1".to_string(),
            StaticValue::String("banana prop1 value".to_string()),
        );

        let mut banana_options = IndexMap::new();
        banana_options.insert(
            "mediaQuery".to_string(),
            StaticValue::String("mq".to_string()),
        );

        let variants = vec![VariantEntry {
            name: "banana".to_string(),
            props: banana_props,
            options: Some(banana_options),
        }];

        let result =
            generate_custom_properties_from_variants(&default_props, None, &variants, None);

        assert_eq!(result.variant_names, vec!["default", "banana"]);
        assert_eq!(result.styles.len(), 4);
        assert!(result.styles[0]
            .starts_with(":root{--jsxstyle-prop1:prop1 value;--jsxstyle-prop2:123px"));
        assert!(result.styles[1].contains(":not(.\\9).jsxstyle_default{"));
        assert!(result.styles[2].contains(":not(.\\9).jsxstyle_banana{"));
        assert!(result.styles[3].starts_with("@media mq{"));
    }

    #[test]
    fn test_generate_mangled() {
        let mut default_props = IndexMap::new();
        default_props.insert(
            "prop1".to_string(),
            StaticValue::String("prop1 value".to_string()),
        );
        default_props.insert("prop2".to_string(), StaticValue::Number(123.0));

        let mut build_options = IndexMap::new();
        build_options.insert(
            "namespace".to_string(),
            StaticValue::String("test".to_string()),
        );
        build_options.insert("mangle".to_string(), StaticValue::Bool(true));

        let result = generate_custom_properties_from_variants(
            &default_props,
            None,
            &[],
            Some(&build_options),
        );

        // With mangle, props should be --test0 and --test1
        assert!(result.styles[0].contains("--test0:prop1 value"));
        assert!(result.styles[0].contains("--test1:123px"));
    }
}
