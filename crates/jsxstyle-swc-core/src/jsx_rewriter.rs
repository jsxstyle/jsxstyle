use swc_core::common::{Span, DUMMY_SP};
use swc_core::ecma::ast::{
    Expr, Ident, IdentName, JSXAttr, JSXAttrName, JSXAttrOrSpread, JSXAttrValue, JSXElementName,
    JSXExpr, JSXExprContainer, SpreadElement, Str,
};

use crate::ternary::build_class_name_expr;
use crate::types::ClassNamePart;

/// Build a JSXAttr for className (or class) from a string literal value.
pub fn build_class_name_attr(prop_name: &str, class_names: &str) -> JSXAttr {
    JSXAttr {
        span: DUMMY_SP,
        name: JSXAttrName::Ident(IdentName::new(prop_name.into(), DUMMY_SP)),
        value: Some(JSXAttrValue::Str(Str {
            span: DUMMY_SP,
            value: class_names.into(),
            raw: None,
        })),
    }
}

/// Build a JSXElementName from a component prop value.
///
/// Rules (matching Babel's handleJsxElement):
/// - No component prop -> "div"
/// - String starting with lowercase -> that HTML element (e.g., "span" -> <span>)
/// - String starting with uppercase -> that component (e.g., "Link" -> <Link>)
/// - Member expression format "Foo.bar" is not handled at the string level (Phase 5+)
pub fn build_element_name(component_value: Option<&str>, span: Span) -> JSXElementName {
    match component_value {
        None => {
            // Default: div
            JSXElementName::Ident(Ident::new("div".into(), span, Default::default()))
        }
        Some(value) => {
            // The component prop value is a string -- use it as the element name
            JSXElementName::Ident(Ident::new(value.into(), span, Default::default()))
        }
    }
}

/// Build the JSXElementName for a runtime-required fallback (Box).
///
/// When a jsxstyle component has props that cannot be statically evaluated,
/// the element is renamed to Box (the runtime component) instead of being
/// replaced with a plain HTML element.
pub fn build_runtime_element_name(span: Span) -> JSXElementName {
    JSXElementName::Ident(Ident::new("Box".into(), span, Default::default()))
}

/// Combine extracted class names with an optional existing className value.
///
/// Implements joinStringExpressions-compatible logic:
/// - Extracted class names are joined with space separator
/// - If an existing className is present, it is included alongside the
///   extracted names and both are sorted alphabetically
/// - This matches the Babel extractor's joinStringExpressions behavior
///   where string literal parts are sorted using localeCompare
///
/// Returns `None` if both `extracted_class_names` is empty and
/// `existing_class_value` is `None`.
pub fn combine_class_names(
    extracted_class_names: &[String],
    existing_class_value: Option<&str>,
) -> Option<String> {
    if extracted_class_names.is_empty() && existing_class_value.is_none() {
        return None;
    }

    let extracted = extracted_class_names.join(" ");
    let combined = match existing_class_value {
        Some(existing) => {
            if extracted.is_empty() {
                existing.to_string()
            } else {
                let mut parts: Vec<&str> = vec![existing, &extracted];
                parts.sort();
                parts.join(" ")
            }
        }
        None => extracted,
    };

    if combined.is_empty() {
        None
    } else {
        Some(combined)
    }
}

/// Build a className JSXAttr from extracted class names and an optional existing value.
///
/// Combines class names using `combine_class_names`, then wraps the result
/// in a JSXAttr node. Returns `None` if no class names are present.
pub fn build_combined_class_attr(
    class_prop_name: &str,
    extracted_class_names: &[String],
    existing_class_value: Option<&str>,
) -> Option<JSXAttr> {
    let combined = combine_class_names(extracted_class_names, existing_class_value)?;
    Some(build_class_name_attr(class_prop_name, &combined))
}

/// Build a className JSXAttr from ClassNameParts that include ternary expressions.
///
/// Produces className expressions like:
///   `className={"_x0 " + (dynamic ? "_x1" : "_x2")}`
///   `className={"_x0 " + (dynamic ? "_x1 _x2" : "_x3 _x4")}`
///
/// If an existing_class_expr is provided (dynamic className from JSX),
/// it is integrated using a template literal wrapping.
///
/// Returns None if there are no class name parts to output.
pub fn build_ternary_class_attr(
    class_prop_name: &str,
    parts: &[ClassNamePart],
    existing_class_expr: Option<Box<Expr>>,
) -> Option<JSXAttr> {
    if parts.is_empty() && existing_class_expr.is_none() {
        return None;
    }

    // Build the className expression using build_class_name_expr
    let class_expr = build_class_name_expr(parts);

    // If there's an existing dynamic className expression, combine with template literal
    let final_expr = if let Some(dynamic_expr) = existing_class_expr {
        // Build template literal: `${classExpr} ${dynamicExpr}`
        use swc_core::ecma::ast::*;
        let tpl = Tpl {
            span: DUMMY_SP,
            exprs: vec![class_expr, dynamic_expr],
            quasis: vec![
                TplElement {
                    span: DUMMY_SP,
                    tail: false,
                    cooked: Some("".into()),
                    raw: "".into(),
                },
                TplElement {
                    span: DUMMY_SP,
                    tail: false,
                    cooked: Some(" ".into()),
                    raw: " ".into(),
                },
                TplElement {
                    span: DUMMY_SP,
                    tail: true,
                    cooked: Some("".into()),
                    raw: "".into(),
                },
            ],
        };
        Box::new(Expr::Tpl(tpl))
    } else {
        class_expr
    };

    Some(JSXAttr {
        span: DUMMY_SP,
        name: JSXAttrName::Ident(IdentName::new(class_prop_name.into(), DUMMY_SP)),
        value: Some(JSXAttrValue::JSXExprContainer(JSXExprContainer {
            span: DUMMY_SP,
            expr: JSXExpr::Expr(final_expr),
        })),
    })
}

/// Convert a `props` prop expression into a JSXAttrOrSpread::SpreadElement.
///
/// The jsxstyle `props` prop forwards additional props to the underlying element.
/// When extracting, this becomes a spread attribute on the output element:
///   `<Block props={{ onClick: handler }} />` -> `<div {...{ onClick: handler }} />`
pub fn props_to_spread(props_expr: Box<swc_core::ecma::ast::Expr>) -> JSXAttrOrSpread {
    JSXAttrOrSpread::SpreadElement(SpreadElement {
        dot3_token: DUMMY_SP,
        expr: props_expr,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_combine_empty() {
        assert_eq!(combine_class_names(&[], None), None);
    }

    #[test]
    fn test_combine_extracted_only() {
        let names = vec!["_a".to_string(), "_b".to_string()];
        assert_eq!(combine_class_names(&names, None), Some("_a _b".to_string()));
    }

    #[test]
    fn test_combine_existing_only() {
        assert_eq!(
            combine_class_names(&[], Some("custom")),
            Some("custom".to_string())
        );
    }

    #[test]
    fn test_combine_both_sorted() {
        let names = vec!["_z".to_string(), "_a".to_string()];
        // extracted joined = "_z _a", parts sorted: ["custom", "_z _a"] -> "custom" < "_z _a"? No...
        // Actually "_z _a" > "custom" alphabetically, so sorted = ["_z _a", "custom"] -> "_z _a custom"
        // Wait: '_' (95) < 'c' (99), so "_z _a" < "custom"
        assert_eq!(
            combine_class_names(&names, Some("custom")),
            Some("_z _a custom".to_string())
        );
    }

    #[test]
    fn test_combine_preserves_extraction_order() {
        // Extracted class names keep their insertion order (not re-sorted individually)
        let names = vec!["_c".to_string(), "_a".to_string(), "_b".to_string()];
        assert_eq!(
            combine_class_names(&names, None),
            Some("_c _a _b".to_string())
        );
    }
}
