use rustc_hash::FxHashMap;

use indexmap::IndexMap;
use swc_core::ecma::ast::Id;
use swc_core::ecma::ast::{BinaryOp, Expr, Lit, MemberProp, Prop, PropName, PropOrSpread, UnaryOp};

use crate::types::{atom_to_string, StaticValue};

/// Evaluate a JSX attribute expression to a static value.
///
/// Takes a bindings map for resolving identifiers to their const-declared values.
/// Returns `None` if the expression cannot be statically evaluated.
pub fn evaluate_expr(expr: &Expr, bindings: &FxHashMap<Id, StaticValue>) -> Option<StaticValue> {
    match expr {
        // String literal
        Expr::Lit(Lit::Str(s)) => Some(StaticValue::String(atom_to_string(&s.value))),

        // Number literal
        Expr::Lit(Lit::Num(n)) => Some(StaticValue::Number(n.value)),

        // Boolean literal
        Expr::Lit(Lit::Bool(b)) => Some(StaticValue::Bool(b.value)),

        // Null literal
        Expr::Lit(Lit::Null(_)) => Some(StaticValue::Null),

        // Identifier: check for `undefined` first, then look up in bindings
        Expr::Ident(id) => {
            if id.sym.as_ref() == "undefined" {
                return Some(StaticValue::Undefined);
            }
            bindings.get(&id.to_id()).cloned()
        }

        // Template literal: concatenate quasis and evaluated expressions
        Expr::Tpl(tpl) => evaluate_template_literal(tpl, bindings),

        // Binary expression: +, -, *, /
        Expr::Bin(bin) => evaluate_binary(bin, bindings),

        // Unary negation: -expr
        Expr::Unary(u) if u.op == UnaryOp::Minus => {
            let arg = evaluate_expr(&u.arg, bindings)?;
            match arg {
                StaticValue::Number(n) => Some(StaticValue::Number(-n)),
                _ => None,
            }
        }

        // Object expression: { key: value, ...spread }
        Expr::Object(obj) => evaluate_object(obj, bindings),

        // Member expression: obj.prop or obj["prop"]
        Expr::Member(member) => evaluate_member_expr(member, bindings),

        // Parenthesized expression: (expr) -- unwrap and evaluate inner
        Expr::Paren(paren) => evaluate_expr(&paren.expr, bindings),

        _ => None,
    }
}

/// Evaluate a template literal by concatenating quasis and interpolated expressions.
fn evaluate_template_literal(
    tpl: &swc_core::ecma::ast::Tpl,
    bindings: &FxHashMap<Id, StaticValue>,
) -> Option<StaticValue> {
    let mut result = String::new();

    for (idx, quasi) in tpl.quasis.iter().enumerate() {
        // Append the quasi (template string part)
        // Use cooked if available, otherwise raw
        // cooked is Option<Wtf8Atom> (as_str -> Option<&str>), raw is Atom (as_str -> &str)
        if let Some(cooked) = &quasi.cooked {
            match cooked.as_str() {
                Some(s) => result.push_str(s),
                None => result.push_str(&cooked.to_string_lossy()),
            }
        } else {
            result.push_str(quasi.raw.as_str());
        }

        // Append the expression (if there is one at this index)
        if let Some(expr) = tpl.exprs.get(idx) {
            let value = evaluate_expr(expr, bindings)?;
            let s = static_value_to_string(&value)?;
            result.push_str(&s);
        }
    }

    Some(StaticValue::String(result))
}

/// Evaluate a binary expression (+, -, *, /).
fn evaluate_binary(
    bin: &swc_core::ecma::ast::BinExpr,
    bindings: &FxHashMap<Id, StaticValue>,
) -> Option<StaticValue> {
    let left = evaluate_expr(&bin.left, bindings)?;
    let right = evaluate_expr(&bin.right, bindings)?;

    match bin.op {
        BinaryOp::Add => {
            // Match JS behavior: if either operand is a string, concatenate
            match (&left, &right) {
                (StaticValue::Number(l), StaticValue::Number(r)) => {
                    Some(StaticValue::Number(l + r))
                }
                (StaticValue::String(l), StaticValue::String(r)) => {
                    Some(StaticValue::String(format!("{l}{r}")))
                }
                (StaticValue::String(l), _) => {
                    let r_str = static_value_to_string(&right)?;
                    Some(StaticValue::String(format!("{l}{r_str}")))
                }
                (_, StaticValue::String(r)) => {
                    let l_str = static_value_to_string(&left)?;
                    Some(StaticValue::String(format!("{l_str}{r}")))
                }
                _ => None,
            }
        }
        BinaryOp::Sub => match (&left, &right) {
            (StaticValue::Number(l), StaticValue::Number(r)) => Some(StaticValue::Number(l - r)),
            _ => None,
        },
        BinaryOp::Mul => match (&left, &right) {
            (StaticValue::Number(l), StaticValue::Number(r)) => Some(StaticValue::Number(l * r)),
            _ => None,
        },
        BinaryOp::Div => match (&left, &right) {
            (StaticValue::Number(l), StaticValue::Number(r)) => Some(StaticValue::Number(l / r)),
            _ => None,
        },
        _ => None,
    }
}

/// Evaluate an object expression where all values are statically resolvable.
fn evaluate_object(
    obj: &swc_core::ecma::ast::ObjectLit,
    bindings: &FxHashMap<Id, StaticValue>,
) -> Option<StaticValue> {
    let mut map = IndexMap::new();

    for prop_or_spread in &obj.props {
        match prop_or_spread {
            PropOrSpread::Prop(prop) => {
                match prop.as_ref() {
                    Prop::KeyValue(kv) => {
                        let key = extract_prop_key(&kv.key)?;
                        let value = evaluate_expr(&kv.value, bindings)?;
                        map.insert(key, value);
                    }
                    Prop::Shorthand(ident) => {
                        // Shorthand: { foo } is equivalent to { foo: foo }
                        let key = ident.sym.as_ref().to_string();
                        let value = bindings.get(&ident.to_id()).cloned()?;
                        map.insert(key, value);
                    }
                    // Other prop types (getter, setter, method) are not statically evaluatable
                    _ => return None,
                }
            }
            PropOrSpread::Spread(spread) => {
                // Evaluate the spread source; it must be an Object to merge
                let value = evaluate_expr(&spread.expr, bindings)?;
                match value {
                    StaticValue::Object(spread_map) => {
                        for (k, v) in spread_map {
                            map.insert(k, v);
                        }
                    }
                    _ => return None,
                }
            }
        }
    }

    Some(StaticValue::Object(map))
}

/// Evaluate a member expression on a statically evaluated object.
fn evaluate_member_expr(
    member: &swc_core::ecma::ast::MemberExpr,
    bindings: &FxHashMap<Id, StaticValue>,
) -> Option<StaticValue> {
    let obj = evaluate_expr(&member.obj, bindings)?;

    let obj_map = match obj {
        StaticValue::Object(map) => map,
        _ => return None,
    };

    let key = match &member.prop {
        MemberProp::Ident(id) => id.sym.as_ref().to_string(),
        MemberProp::Computed(computed) => match computed.expr.as_ref() {
            Expr::Lit(Lit::Str(s)) => atom_to_string(&s.value),
            Expr::Lit(Lit::Num(n)) => {
                if n.value.fract() == 0.0 {
                    format!("{}", n.value as i64)
                } else {
                    format!("{}", n.value)
                }
            }
            _ => return None,
        },
        _ => return None,
    };

    obj_map.get(&key).cloned()
}

/// Extract a string key from a property name.
fn extract_prop_key(key: &PropName) -> Option<String> {
    match key {
        PropName::Ident(id) => Some(id.sym.as_ref().to_string()),
        PropName::Str(s) => Some(atom_to_string(&s.value)),
        PropName::Num(n) => {
            if n.value.fract() == 0.0 {
                Some(format!("{}", n.value as i64))
            } else {
                Some(format!("{}", n.value))
            }
        }
        PropName::Computed(computed) => {
            // For computed keys, try to evaluate the expression
            match computed.expr.as_ref() {
                Expr::Lit(Lit::Str(s)) => Some(atom_to_string(&s.value)),
                Expr::Lit(Lit::Num(n)) => {
                    if n.value.fract() == 0.0 {
                        Some(format!("{}", n.value as i64))
                    } else {
                        Some(format!("{}", n.value))
                    }
                }
                _ => None,
            }
        }
        PropName::BigInt(_) => None,
    }
}

/// Convert a StaticValue to its string representation (for template literal interpolation).
/// Returns None for values that can't be meaningfully stringified (Object).
pub fn static_value_to_string(val: &StaticValue) -> Option<String> {
    match val {
        StaticValue::String(s) => Some(s.clone()),
        StaticValue::Number(n) => {
            if n.fract() == 0.0 {
                Some(format!("{}", *n as i64))
            } else {
                Some(format!("{n}"))
            }
        }
        StaticValue::Bool(b) => Some(if *b { "true" } else { "false" }.to_string()),
        StaticValue::Null => Some("null".to_string()),
        StaticValue::Undefined => Some("undefined".to_string()),
        StaticValue::Object(_) => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn empty_bindings() -> FxHashMap<Id, StaticValue> {
        FxHashMap::default()
    }

    #[test]
    #[allow(clippy::approx_constant)] // 3.14 is a decimal-formatting fixture, not PI
    fn test_static_value_to_string() {
        assert_eq!(
            static_value_to_string(&StaticValue::String("hello".to_string())),
            Some("hello".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Number(42.0)),
            Some("42".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Number(3.14)),
            Some("3.14".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Bool(true)),
            Some("true".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Bool(false)),
            Some("false".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Null),
            Some("null".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Undefined),
            Some("undefined".to_string())
        );
        assert_eq!(
            static_value_to_string(&StaticValue::Object(IndexMap::new())),
            None
        );
    }

    #[test]
    fn test_evaluate_string_literal() {
        use swc_core::common::DUMMY_SP;
        use swc_core::ecma::ast::Str;

        let bindings = empty_bindings();

        let expr = Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "hello".into(),
            raw: None,
        }));
        assert_eq!(
            evaluate_expr(&expr, &bindings),
            Some(StaticValue::String("hello".to_string()))
        );
    }

    #[test]
    fn test_evaluate_number_literal() {
        use swc_core::common::DUMMY_SP;
        use swc_core::ecma::ast::Number;

        let bindings = empty_bindings();

        let expr = Expr::Lit(Lit::Num(Number {
            span: DUMMY_SP,
            value: 42.0,
            raw: None,
        }));
        assert_eq!(
            evaluate_expr(&expr, &bindings),
            Some(StaticValue::Number(42.0))
        );
    }

    #[test]
    fn test_evaluate_bool_literal() {
        use swc_core::common::DUMMY_SP;
        use swc_core::ecma::ast::Bool;

        let bindings = empty_bindings();

        let expr = Expr::Lit(Lit::Bool(Bool {
            span: DUMMY_SP,
            value: true,
        }));
        assert_eq!(
            evaluate_expr(&expr, &bindings),
            Some(StaticValue::Bool(true))
        );
    }

    #[test]
    fn test_evaluate_null_literal() {
        use swc_core::common::DUMMY_SP;
        use swc_core::ecma::ast::Null;

        let bindings = empty_bindings();

        let expr = Expr::Lit(Lit::Null(Null { span: DUMMY_SP }));
        assert_eq!(evaluate_expr(&expr, &bindings), Some(StaticValue::Null));
    }

    #[test]
    fn test_evaluate_undefined_ident() {
        use swc_core::common::DUMMY_SP;
        use swc_core::ecma::ast::Ident;

        let bindings = empty_bindings();

        let expr = Expr::Ident(Ident::new_no_ctxt("undefined".into(), DUMMY_SP));
        assert_eq!(
            evaluate_expr(&expr, &bindings),
            Some(StaticValue::Undefined)
        );
    }

    #[test]
    fn test_evaluate_unknown_ident_returns_none() {
        use swc_core::common::DUMMY_SP;
        use swc_core::ecma::ast::Ident;

        let bindings = empty_bindings();

        let expr = Expr::Ident(Ident::new_no_ctxt("unknownVar".into(), DUMMY_SP));
        assert_eq!(evaluate_expr(&expr, &bindings), None);
    }
}
