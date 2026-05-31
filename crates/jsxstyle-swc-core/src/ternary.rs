//! Ternary/conditional expression extraction for jsxstyle style props.
//!
//! Ports the Babel reference implementations:
//! - `normalizeTernary.ts` -> `normalize_ternary()`
//! - `styleObjectUtils.ts` -> `StyleTree`, `update_style_tree()`
//! - `getValue.ts` -> recursive value resolution via `get_style_value()`
//! - `convertStyleObjectToClassNameNode` -> `convert_style_tree_to_class_parts()`
//! - `joinStringExpressions` -> `build_class_name_expr()`

use rustc_hash::FxHashMap;

use indexmap::IndexMap;
use swc_core::common::DUMMY_SP;
use swc_core::ecma::ast::Id;
use swc_core::ecma::ast::{BinExpr, BinaryOp, CondExpr, Expr, Lit, Null, Str, UnaryOp};

use crate::css_gen::{expand_shorthand, parse_prop_name};
use crate::dangerous_style_value::dangerous_style_value;
use crate::static_eval::evaluate_expr;
use crate::types::{atom_to_string, ClassNamePart, CssRule, StaticValue};

// ---------------------------------------------------------------------------
// NormalizedTernary and normalize_ternary()
// ---------------------------------------------------------------------------

/// A ternary expression normalized to canonical form.
pub struct NormalizedTernary {
    pub test: Box<Expr>,
    pub consequent: Box<Expr>,
    pub alternate: Box<Expr>,
}

/// Normalize a ConditionalExpression or LogicalExpression into a canonical ternary.
///
/// Port of `normalizeTernary.ts`. Applied transformations:
/// 1. ConditionalExpression -> extract test/consequent/alternate
/// 2. LogicalExpression(&&) -> `left ? right : null`
/// 3. LogicalExpression(||) -> `left ? left : right` (EXTENSION beyond Babel)
/// 4. LogicalExpression(??) -> `left != null ? left : right` (EXTENSION beyond Babel)
/// 5. Unwrap double-bang: `!!a` -> `a`
/// 6. Flip negation: `!a ? b : c` -> `a ? c : b`
/// 7. Flip inequality: `a !== b ? c : d` -> `a === b ? d : c`
/// 8. Empty string branches -> null
pub fn normalize_ternary(expr: &Expr) -> Option<NormalizedTernary> {
    let (mut test, mut consequent, mut alternate) = match expr {
        Expr::Cond(cond) => (cond.test.clone(), cond.cons.clone(), cond.alt.clone()),
        Expr::Bin(bin) if bin.op == BinaryOp::LogicalAnd => (
            bin.left.clone(),
            bin.right.clone(),
            Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP }))),
        ),
        Expr::Bin(bin) if bin.op == BinaryOp::LogicalOr => {
            (bin.left.clone(), bin.left.clone(), bin.right.clone())
        }
        Expr::Bin(bin) if bin.op == BinaryOp::NullishCoalescing => {
            // Desugar `a ?? b` to `a != null ? a : b`
            let null_check = Box::new(Expr::Bin(BinExpr {
                span: DUMMY_SP,
                op: BinaryOp::NotEq,
                left: bin.left.clone(),
                right: Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP }))),
            }));
            (null_check, bin.left.clone(), bin.right.clone())
        }
        _ => return None,
    };

    // Step 5: Unwrap double-bang: !!a -> a
    if let Expr::Unary(outer) = test.as_ref() {
        if outer.op == UnaryOp::Bang {
            if let Expr::Unary(inner) = outer.arg.as_ref() {
                if inner.op == UnaryOp::Bang {
                    test = inner.arg.clone();
                }
            }
        }
    }

    // Step 6 & 7: Flip negation and inequality
    let should_flip = match test.as_ref() {
        // !a ? b : c -> a ? c : b
        Expr::Unary(u) if u.op == UnaryOp::Bang => true,
        // a !== b ? c : d -> a === b ? d : c
        // a != b ? c : d -> a == b ? d : c
        Expr::Bin(bin) if bin.op == BinaryOp::NotEq || bin.op == BinaryOp::NotEqEq => true,
        _ => false,
    };

    if should_flip {
        match test.as_ref() {
            Expr::Unary(u) if u.op == UnaryOp::Bang => {
                test = u.arg.clone();
            }
            Expr::Bin(bin) if bin.op == BinaryOp::NotEq || bin.op == BinaryOp::NotEqEq => {
                let new_op = if bin.op == BinaryOp::NotEq {
                    BinaryOp::EqEq
                } else {
                    BinaryOp::EqEqEq
                };
                test = Box::new(Expr::Bin(BinExpr {
                    span: bin.span,
                    op: new_op,
                    left: bin.left.clone(),
                    right: bin.right.clone(),
                }));
            }
            _ => {}
        }
        std::mem::swap(&mut consequent, &mut alternate);
    }

    // Step 8: Empty string branches -> null
    if is_empty_string(&consequent) {
        consequent = Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP })));
    }
    if is_empty_string(&alternate) {
        alternate = Box::new(Expr::Lit(Lit::Null(Null { span: DUMMY_SP })));
    }

    Some(NormalizedTernary {
        test,
        consequent,
        alternate,
    })
}

/// Check if an expression is an empty string literal.
fn is_empty_string(expr: &Expr) -> bool {
    if let Expr::Lit(Lit::Str(s)) = expr {
        match s.value.as_str() {
            Some(v) => v.is_empty(),
            None => s.value.to_string_lossy().is_empty(),
        }
    } else {
        false
    }
}

// ---------------------------------------------------------------------------
// StyleValue -- recursive value type (port of TernaryValue/PrimitiveValue)
// ---------------------------------------------------------------------------

/// A style value that is either a static primitive or a conditional branch.
/// Port of the Babel TernaryValue | PrimitiveValue union from getValue.ts.
pub enum StyleValue {
    Primitive(StaticValue),
    Ternary {
        test: Box<Expr>,
        consequent: Box<StyleValue>,
        alternate: Box<StyleValue>,
    },
}

/// Recursively evaluate an expression into a StyleValue.
/// Port of `getValue` from getValue.ts.
///
/// If the expression is a ConditionalExpression or LogicalExpression,
/// normalize it and recursively evaluate both branches.
/// Otherwise, attempt static evaluation.
pub fn get_style_value(
    expr: &Expr,
    bindings: &FxHashMap<Id, StaticValue>,
) -> Result<StyleValue, ()> {
    // Check for ternary/logical expressions first
    if matches!(expr, Expr::Cond(_))
        || matches!(expr, Expr::Bin(bin) if bin.op == BinaryOp::LogicalAnd
            || bin.op == BinaryOp::LogicalOr
            || bin.op == BinaryOp::NullishCoalescing)
    {
        let normalized = normalize_ternary(expr).ok_or(())?;
        let cons_val = get_style_value(&normalized.consequent, bindings)?;
        let alt_val = get_style_value(&normalized.alternate, bindings)?;
        return Ok(StyleValue::Ternary {
            test: normalized.test,
            consequent: Box::new(cons_val),
            alternate: Box::new(alt_val),
        });
    }

    // Try to evaluate as a null/undefined literal (these are valid branch values)
    if matches!(expr, Expr::Lit(Lit::Null(_))) {
        return Ok(StyleValue::Primitive(StaticValue::Null));
    }
    if let Expr::Ident(id) = expr {
        if id.sym.as_ref() == "undefined" {
            return Ok(StyleValue::Primitive(StaticValue::Undefined));
        }
    }

    // Try static evaluation
    match evaluate_expr(expr, bindings) {
        Some(val) => Ok(StyleValue::Primitive(val)),
        None => Err(()), // Unextractable
    }
}

// ---------------------------------------------------------------------------
// StyleTree and update_style_tree()
// ---------------------------------------------------------------------------

/// A tree of style entries with optional ternary branching.
/// Port of Babel's `StaticStyleObject` from styleObjectUtils.ts.
///
/// Uses IndexMap for insertion-order determinism matching JS object behavior.
#[derive(Default)]
pub struct StyleTree {
    /// Static styles: CSS prop name -> static value.
    pub styles: IndexMap<String, StaticValue>,
    /// Ternary branches: condition_key -> { test, consequent tree, alternate tree }.
    pub ternaries: IndexMap<String, TernaryBranch>,
}

/// A ternary branch in the style tree.
pub struct TernaryBranch {
    pub test: Box<Expr>,
    pub consequent: StyleTree,
    pub alternate: StyleTree,
}

/// Update a style tree with a style value for a given prop.
/// Port of `updateStyleObject` from styleObjectUtils.ts.
///
/// If the value is a primitive, add to `tree.styles`.
/// If the value is a ternary, group by the serialized test expression
/// and recurse into the consequent/alternate sub-trees.
pub fn update_style_tree(tree: &mut StyleTree, key: &str, value: StyleValue) {
    match value {
        StyleValue::Primitive(val) => {
            tree.styles.insert(key.to_string(), val);
        }
        StyleValue::Ternary {
            test,
            consequent,
            alternate,
        } => {
            let ternary_key = expr_to_grouping_key(&test);
            let branch = tree
                .ternaries
                .entry(ternary_key)
                .or_insert_with(|| TernaryBranch {
                    test,
                    consequent: StyleTree::default(),
                    alternate: StyleTree::default(),
                });
            update_style_tree(&mut branch.alternate, key, *alternate);
            update_style_tree(&mut branch.consequent, key, *consequent);
        }
    }
}

// ---------------------------------------------------------------------------
// expr_to_grouping_key() -- canonical string for ternary grouping
// ---------------------------------------------------------------------------

/// Serialize an expression to a canonical string for ternary grouping.
///
/// This doesn't need to match Babel's `generate(node).code` exactly --
/// it only needs to be internally consistent (same expression -> same key).
/// We write a lightweight recursive string builder covering common cases.
/// Also used by the visitor for noRuntime error messages (expression source).
pub fn expr_to_grouping_key(expr: &Expr) -> String {
    let mut out = String::new();
    write_grouping_key(expr, &mut out);
    out
}

/// Recursive helper that pushes the canonical string representation of an
/// expression into `out`, avoiding intermediate String allocations.
fn write_grouping_key(expr: &Expr, out: &mut String) {
    use std::fmt::Write;
    match expr {
        Expr::Ident(id) => out.push_str(id.sym.as_ref()),
        Expr::Lit(Lit::Str(s)) => {
            out.push('"');
            out.push_str(&atom_to_string(&s.value));
            out.push('"');
        }
        Expr::Lit(Lit::Num(n)) => {
            if n.value.fract() == 0.0 {
                let _ = write!(out, "{}", n.value as i64);
            } else {
                let _ = write!(out, "{}", n.value);
            }
        }
        Expr::Lit(Lit::Bool(b)) => {
            let _ = write!(out, "{}", b.value);
        }
        Expr::Lit(Lit::Null(_)) => out.push_str("null"),
        Expr::Member(member) => {
            write_grouping_key(&member.obj, out);
            match &member.prop {
                swc_core::ecma::ast::MemberProp::Ident(id) => {
                    out.push('.');
                    out.push_str(id.sym.as_ref());
                }
                swc_core::ecma::ast::MemberProp::Computed(comp) => {
                    out.push('[');
                    write_grouping_key(&comp.expr, out);
                    out.push(']');
                }
                _ => out.push('?'),
            }
        }
        Expr::Call(call) => {
            match &call.callee {
                swc_core::ecma::ast::Callee::Expr(e) => write_grouping_key(e, out),
                _ => out.push('?'),
            }
            out.push('(');
            for (i, arg) in call.args.iter().enumerate() {
                if i > 0 {
                    out.push_str(", ");
                }
                write_grouping_key(&arg.expr, out);
            }
            out.push(')');
        }
        Expr::Bin(bin) => {
            write_grouping_key(&bin.left, out);
            let op = match bin.op {
                BinaryOp::EqEqEq => " === ",
                BinaryOp::NotEqEq => " !== ",
                BinaryOp::EqEq => " == ",
                BinaryOp::NotEq => " != ",
                BinaryOp::Lt => " < ",
                BinaryOp::LtEq => " <= ",
                BinaryOp::Gt => " > ",
                BinaryOp::GtEq => " >= ",
                BinaryOp::Add => " + ",
                BinaryOp::Sub => " - ",
                BinaryOp::Mul => " * ",
                BinaryOp::Div => " / ",
                BinaryOp::Mod => " % ",
                BinaryOp::BitAnd => " & ",
                BinaryOp::BitOr => " | ",
                BinaryOp::BitXor => " ^ ",
                BinaryOp::LShift => " << ",
                BinaryOp::RShift => " >> ",
                BinaryOp::ZeroFillRShift => " >>> ",
                BinaryOp::LogicalAnd => " && ",
                BinaryOp::LogicalOr => " || ",
                BinaryOp::NullishCoalescing => " ?? ",
                BinaryOp::Exp => " ** ",
                BinaryOp::In => " in ",
                BinaryOp::InstanceOf => " instanceof ",
            };
            out.push_str(op);
            write_grouping_key(&bin.right, out);
        }
        Expr::Unary(u) => {
            let op = match u.op {
                UnaryOp::Bang => "!",
                UnaryOp::Minus => "-",
                UnaryOp::Plus => "+",
                UnaryOp::Tilde => "~",
                UnaryOp::TypeOf => "typeof ",
                UnaryOp::Void => "void ",
                UnaryOp::Delete => "delete ",
            };
            out.push_str(op);
            write_grouping_key(&u.arg, out);
        }
        Expr::Paren(p) => write_grouping_key(&p.expr, out),
        Expr::Cond(c) => {
            write_grouping_key(&c.test, out);
            out.push_str(" ? ");
            write_grouping_key(&c.cons, out);
            out.push_str(" : ");
            write_grouping_key(&c.alt, out);
        }
        Expr::OptChain(opt) => match opt.base.as_ref() {
            swc_core::ecma::ast::OptChainBase::Member(member) => {
                write_grouping_key(&member.obj, out);
                out.push_str("?.");
                match &member.prop {
                    swc_core::ecma::ast::MemberProp::Ident(id) => {
                        out.push_str(id.sym.as_ref());
                    }
                    swc_core::ecma::ast::MemberProp::Computed(comp) => {
                        out.push('[');
                        write_grouping_key(&comp.expr, out);
                        out.push(']');
                    }
                    _ => out.push('?'),
                }
            }
            swc_core::ecma::ast::OptChainBase::Call(call) => {
                write_grouping_key(&call.callee, out);
                out.push_str("?.(");
                for (i, arg) in call.args.iter().enumerate() {
                    if i > 0 {
                        out.push_str(", ");
                    }
                    write_grouping_key(&arg.expr, out);
                }
                out.push(')');
            }
        },
        Expr::Tpl(tpl) => {
            out.push('`');
            for (idx, quasi) in tpl.quasis.iter().enumerate() {
                out.push_str(quasi.raw.as_str());
                if let Some(expr) = tpl.exprs.get(idx) {
                    out.push_str("${");
                    write_grouping_key(expr, out);
                    out.push('}');
                }
            }
            out.push('`');
        }
        _ => {
            let _ = write!(out, "?{:p}", expr);
        }
    }
}

// ---------------------------------------------------------------------------
// CSS emission from StyleTree
// ---------------------------------------------------------------------------

/// Generate CSS for a single static style entry and return the class name.
/// Reuses the visitor's class_name_cache and css_rules.
fn emit_css_for_leaf(
    css_prop_name: &str,
    value: &StaticValue,
    class_name_cache: &mut FxHashMap<String, String>,
    css_rules: &mut Vec<CssRule>,
    class_name_fn: &mut dyn FnMut(&str) -> String,
) -> Option<String> {
    let css_value = dangerous_style_value(css_prop_name, value)?;
    let key = format!("{}:{}", css_prop_name, css_value);

    if let Some(cached) = class_name_cache.get(&key) {
        return Some(cached.clone());
    }

    let class_name = class_name_fn(&key);
    class_name_cache.insert(key, class_name.clone());

    let rule = crate::css_gen::generate_css_rule(&class_name, css_prop_name, &css_value);
    css_rules.push(CssRule { rule });
    Some(class_name)
}

/// Convert a StyleTree to ClassNameParts, generating CSS along the way.
///
/// Port of `convertStyleObjectToClassNameNode` from styleObjectUtils.ts.
/// For static styles: look up class names from the style entries.
/// For ternary branches: recursively convert sub-trees.
pub fn convert_style_tree_to_class_parts(
    tree: &StyleTree,
    class_name_cache: &mut FxHashMap<String, String>,
    css_rules: &mut Vec<CssRule>,
    class_name_fn: &mut dyn FnMut(&str) -> String,
) -> Vec<ClassNamePart> {
    let mut parts = Vec::new();

    // Process static styles
    if !tree.styles.is_empty() {
        let mut class_names = Vec::new();
        for (prop_name, value) in &tree.styles {
            // Skip null/undefined values (they produce no CSS)
            if matches!(value, StaticValue::Null | StaticValue::Undefined) {
                continue;
            }

            // Parse prop name and expand shorthands
            let parsed = parse_prop_name(prop_name);
            if let Some(expanded_props) = expand_shorthand(&parsed.css_prop_name) {
                for expanded_prop in expanded_props {
                    if let Some(cn) = emit_css_for_leaf(
                        expanded_prop,
                        value,
                        class_name_cache,
                        css_rules,
                        class_name_fn,
                    ) {
                        class_names.push(cn);
                    }
                }
            } else if let Some(cn) = emit_css_for_leaf(
                &parsed.css_prop_name,
                value,
                class_name_cache,
                css_rules,
                class_name_fn,
            ) {
                class_names.push(cn);
            }
        }
        if !class_names.is_empty() {
            parts.push(ClassNamePart::Static(class_names.join(" ")));
        }
    }

    // Process ternary branches
    for branch in tree.ternaries.values() {
        let cons_parts = convert_style_tree_to_class_parts(
            &branch.consequent,
            class_name_cache,
            css_rules,
            class_name_fn,
        );
        let alt_parts = convert_style_tree_to_class_parts(
            &branch.alternate,
            class_name_cache,
            css_rules,
            class_name_fn,
        );

        // Check for identical branches -- collapse to static if both produce the same output
        let cons_str = parts_to_flat_string(&cons_parts);
        let alt_str = parts_to_flat_string(&alt_parts);
        if cons_str == alt_str {
            // Identical branches collapse to static (no ternary in output)
            if let Some(s) = cons_str {
                if !s.is_empty() {
                    parts.push(ClassNamePart::Static(s));
                }
            }
        } else {
            parts.push(ClassNamePart::Ternary {
                test: branch.test.clone(),
                consequent: cons_parts,
                alternate: alt_parts,
            });
        }
    }

    parts
}

/// Try to flatten ClassNameParts into a single static string.
/// Returns None if there are no parts, Some("") if all parts are empty,
/// or Some(string) if all parts are Static.
/// Returns None if any part is a Ternary (cannot flatten).
fn parts_to_flat_string(parts: &[ClassNamePart]) -> Option<String> {
    if parts.is_empty() {
        return Some(String::new());
    }
    let mut result = Vec::new();
    for part in parts {
        match part {
            ClassNamePart::Static(s) => {
                if !s.is_empty() {
                    result.push(s.as_str());
                }
            }
            ClassNamePart::Ternary { .. } => return None,
        }
    }
    Some(result.join(" "))
}

// ---------------------------------------------------------------------------
// build_class_name_expr() -- port of joinStringExpressions
// ---------------------------------------------------------------------------

/// Build the final className expression from static class names and ternary parts.
///
/// Port of `joinStringExpressions` from joinStringExpressions.ts.
/// Produces SWC AST: `"_x0 " + (cond ? "_x1" : "_x2") + " " + (cond2 ? "_x3" : "")`
///
/// The function handles:
/// - Sorting string literals to the front (alphabetically among themselves)
/// - Filtering out null/empty parts
/// - Joining with space separators via `+` BinaryExpression
/// - Merging adjacent string literals
pub fn build_class_name_expr(parts: &[ClassNamePart]) -> Box<Expr> {
    // Convert ClassNameParts into a list of SWC expressions
    let mut exprs: Vec<Box<Expr>> = Vec::new();

    // Separate static and ternary parts for sorting
    let mut static_parts: Vec<String> = Vec::new();
    let mut ternary_exprs: Vec<Box<Expr>> = Vec::new();

    for part in parts {
        match part {
            ClassNamePart::Static(s) => {
                if !s.is_empty() {
                    static_parts.push(s.clone());
                }
            }
            ClassNamePart::Ternary {
                test,
                consequent,
                alternate,
            } => {
                let cons_expr = class_parts_to_expr(consequent);
                let alt_expr = class_parts_to_expr(alternate);
                ternary_exprs.push(Box::new(Expr::Cond(CondExpr {
                    span: DUMMY_SP,
                    test: test.clone(),
                    cons: cons_expr,
                    alt: alt_expr,
                })));
            }
        }
    }

    // Sort string literals (matching Babel's localeCompare sort)
    static_parts.sort();

    // Build expression list: string literals first, then ternaries
    // Following joinStringExpressions pattern: filter, sort, join with spaces
    for s in &static_parts {
        exprs.push(Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: s.as_str().into(),
            raw: None,
        }))));
    }
    for t in ternary_exprs {
        exprs.push(t);
    }

    if exprs.is_empty() {
        return Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "".into(),
            raw: None,
        })));
    }

    // Join expressions with space separators and merge adjacent string literals
    // Port of joinStringExpressions reduce logic
    let mut joined: Vec<Box<Expr>> = Vec::new();
    for (i, expr) in exprs.into_iter().enumerate() {
        if i > 0 {
            joined.push(Box::new(Expr::Lit(Lit::Str(Str {
                span: DUMMY_SP,
                value: " ".into(),
                raw: None,
            }))));
        }
        joined.push(expr);
    }

    // Merge adjacent string literals and build final expression
    // Start with empty string (matching Babel's initial accumulator)
    let mut result: Box<Expr> = Box::new(Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: "".into(),
        raw: None,
    })));

    for b in joined {
        result = merge_exprs(result, b);
    }

    result
}

/// Merge two expressions using BinaryExpression(+), with string literal optimization.
/// Port of the final reduce in joinStringExpressions.
fn merge_exprs(a: Box<Expr>, b: Box<Expr>) -> Box<Expr> {
    // Both string literals -> merge into one
    if let (Expr::Lit(Lit::Str(sa)), Expr::Lit(Lit::Str(sb))) = (a.as_ref(), b.as_ref()) {
        let a_str = match sa.value.as_str() {
            Some(v) => v,
            None => return concat_bin(a, b),
        };
        let b_str = match sb.value.as_str() {
            Some(v) => v,
            None => return concat_bin(a, b),
        };
        return Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: format!("{}{}", a_str, b_str).into(),
            raw: None,
        })));
    }

    // a is StringLiteral and b is BinaryExpression with StringLiteral left -> merge a into b.left
    if let Expr::Lit(Lit::Str(sa)) = a.as_ref() {
        if let Expr::Bin(bin) = b.as_ref() {
            if bin.op == BinaryOp::Add {
                if let Expr::Lit(Lit::Str(sb_left)) = bin.left.as_ref() {
                    let a_str = match sa.value.as_str() {
                        Some(v) => v,
                        None => return concat_bin(a, b),
                    };
                    let b_left_str = match sb_left.value.as_str() {
                        Some(v) => v,
                        None => return concat_bin(a, b),
                    };
                    return Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: BinaryOp::Add,
                        left: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: format!("{}{}", a_str, b_left_str).into(),
                            raw: None,
                        }))),
                        right: bin.right.clone(),
                    }));
                }
            }
        }
    }

    // a is BinaryExpression with StringLiteral right and b is StringLiteral -> merge b into a.right
    if let Expr::Bin(bin_a) = a.as_ref() {
        if bin_a.op == BinaryOp::Add {
            if let Expr::Lit(Lit::Str(sa_right)) = bin_a.right.as_ref() {
                if let Expr::Lit(Lit::Str(sb)) = b.as_ref() {
                    let a_right_str = match sa_right.value.as_str() {
                        Some(v) => v,
                        None => return concat_bin(a, b),
                    };
                    let b_str = match sb.value.as_str() {
                        Some(v) => v,
                        None => return concat_bin(a, b),
                    };
                    return Box::new(Expr::Bin(BinExpr {
                        span: DUMMY_SP,
                        op: BinaryOp::Add,
                        left: bin_a.left.clone(),
                        right: Box::new(Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: format!("{}{}", a_right_str, b_str).into(),
                            raw: None,
                        }))),
                    }));
                }
            }
        }
    }

    concat_bin(a, b)
}

/// Build a simple BinaryExpression(+) for string concatenation.
fn concat_bin(a: Box<Expr>, b: Box<Expr>) -> Box<Expr> {
    Box::new(Expr::Bin(BinExpr {
        span: DUMMY_SP,
        op: BinaryOp::Add,
        left: a,
        right: b,
    }))
}

/// Convert ClassNameParts into a single expression (for ternary branches).
/// If the parts are all static, produces a string literal.
/// If empty, produces an empty string literal.
/// For a single ternary part, produces a direct CondExpr (no wrapping).
fn class_parts_to_expr(parts: &[ClassNamePart]) -> Box<Expr> {
    if parts.is_empty() {
        return Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: "".into(),
            raw: None,
        })));
    }

    // Check if all parts are static
    let flat = parts_to_flat_string(parts);
    if let Some(s) = flat {
        return Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: s.into(),
            raw: None,
        })));
    }

    // Special case: single ternary part with no static parts
    // -> directly produce a CondExpr (no "" + wrapping)
    // This is important for nested ternaries: `a ? "_x1" : b ? "_x2" : "_x3"`
    if parts.len() == 1 {
        if let ClassNamePart::Ternary {
            test,
            consequent,
            alternate,
        } = &parts[0]
        {
            let cons_expr = class_parts_to_expr(consequent);
            let alt_expr = class_parts_to_expr(alternate);
            return Box::new(Expr::Cond(CondExpr {
                span: DUMMY_SP,
                test: test.clone(),
                cons: cons_expr,
                alt: alt_expr,
            }));
        }
    }

    // Mixed parts -- build expression by recursion through build_class_name_expr
    build_class_name_expr(parts)
}

#[cfg(test)]
mod tests {
    use super::*;
    use swc_core::common::DUMMY_SP;
    use swc_core::ecma::ast::{Ident, Number};

    fn make_ident(name: &str) -> Box<Expr> {
        Box::new(Expr::Ident(Ident::new(
            name.into(),
            DUMMY_SP,
            Default::default(),
        )))
    }

    fn make_str(s: &str) -> Box<Expr> {
        Box::new(Expr::Lit(Lit::Str(Str {
            span: DUMMY_SP,
            value: s.into(),
            raw: None,
        })))
    }

    #[test]
    fn test_normalize_conditional() {
        let expr = Expr::Cond(CondExpr {
            span: DUMMY_SP,
            test: make_ident("cond"),
            cons: make_str("red"),
            alt: make_str("blue"),
        });
        let result = normalize_ternary(&expr).unwrap();
        assert!(matches!(result.test.as_ref(), Expr::Ident(id) if id.sym.as_ref() == "cond"));
    }

    #[test]
    fn test_normalize_logical_and() {
        let expr = Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: BinaryOp::LogicalAnd,
            left: make_ident("cond"),
            right: make_str("red"),
        });
        let result = normalize_ternary(&expr).unwrap();
        assert!(matches!(result.alternate.as_ref(), Expr::Lit(Lit::Null(_))));
    }

    #[test]
    fn test_normalize_double_bang() {
        // !!cond ? a : b -> cond ? a : b
        let inner_bang = Expr::Unary(swc_core::ecma::ast::UnaryExpr {
            span: DUMMY_SP,
            op: UnaryOp::Bang,
            arg: make_ident("cond"),
        });
        let outer_bang = Box::new(Expr::Unary(swc_core::ecma::ast::UnaryExpr {
            span: DUMMY_SP,
            op: UnaryOp::Bang,
            arg: Box::new(inner_bang),
        }));
        let expr = Expr::Cond(CondExpr {
            span: DUMMY_SP,
            test: outer_bang,
            cons: make_str("a"),
            alt: make_str("b"),
        });
        let result = normalize_ternary(&expr).unwrap();
        assert!(matches!(result.test.as_ref(), Expr::Ident(id) if id.sym.as_ref() == "cond"));
    }

    #[test]
    fn test_normalize_negation_flip() {
        // !cond ? a : b -> cond ? b : a
        let bang = Box::new(Expr::Unary(swc_core::ecma::ast::UnaryExpr {
            span: DUMMY_SP,
            op: UnaryOp::Bang,
            arg: make_ident("cond"),
        }));
        let expr = Expr::Cond(CondExpr {
            span: DUMMY_SP,
            test: bang,
            cons: make_str("a"),
            alt: make_str("b"),
        });
        let result = normalize_ternary(&expr).unwrap();
        // Test should be `cond` (unwrapped)
        assert!(matches!(result.test.as_ref(), Expr::Ident(id) if id.sym.as_ref() == "cond"));
        // Branches should be swapped: consequent=b, alternate=a
        assert!(
            matches!(result.consequent.as_ref(), Expr::Lit(Lit::Str(s)) if s.value.as_str() == Some("b"))
        );
        assert!(
            matches!(result.alternate.as_ref(), Expr::Lit(Lit::Str(s)) if s.value.as_str() == Some("a"))
        );
    }

    #[test]
    fn test_normalize_inequality_flip() {
        // x !== 4 ? a : b -> x === 4 ? b : a
        let test = Box::new(Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: BinaryOp::NotEqEq,
            left: make_ident("x"),
            right: Box::new(Expr::Lit(Lit::Num(Number {
                span: DUMMY_SP,
                value: 4.0,
                raw: None,
            }))),
        }));
        let expr = Expr::Cond(CondExpr {
            span: DUMMY_SP,
            test,
            cons: make_str("a"),
            alt: make_str("b"),
        });
        let result = normalize_ternary(&expr).unwrap();
        assert!(matches!(result.test.as_ref(), Expr::Bin(bin) if bin.op == BinaryOp::EqEqEq));
        // Branches swapped
        assert!(
            matches!(result.consequent.as_ref(), Expr::Lit(Lit::Str(s)) if s.value.as_str() == Some("b"))
        );
        assert!(
            matches!(result.alternate.as_ref(), Expr::Lit(Lit::Str(s)) if s.value.as_str() == Some("a"))
        );
    }

    #[test]
    fn test_normalize_empty_string_to_null() {
        let expr = Expr::Cond(CondExpr {
            span: DUMMY_SP,
            test: make_ident("cond"),
            cons: make_str(""),
            alt: make_str("value"),
        });
        let result = normalize_ternary(&expr).unwrap();
        assert!(matches!(
            result.consequent.as_ref(),
            Expr::Lit(Lit::Null(_))
        ));
    }

    #[test]
    fn test_grouping_key_ident() {
        let expr = Expr::Ident(Ident::new("dynamic".into(), DUMMY_SP, Default::default()));
        assert_eq!(expr_to_grouping_key(&expr), "dynamic");
    }

    #[test]
    fn test_grouping_key_binary() {
        let expr = Expr::Bin(BinExpr {
            span: DUMMY_SP,
            op: BinaryOp::Mod,
            left: make_ident("dynamic"),
            right: Box::new(Expr::Lit(Lit::Num(Number {
                span: DUMMY_SP,
                value: 2.0,
                raw: None,
            }))),
        });
        assert_eq!(expr_to_grouping_key(&expr), "dynamic % 2");
    }

    #[test]
    fn test_style_tree_grouping() {
        let mut tree = StyleTree::default();
        update_style_tree(
            &mut tree,
            "color",
            StyleValue::Ternary {
                test: make_ident("cond"),
                consequent: Box::new(StyleValue::Primitive(StaticValue::String(
                    "red".to_string(),
                ))),
                alternate: Box::new(StyleValue::Primitive(StaticValue::String(
                    "blue".to_string(),
                ))),
            },
        );
        update_style_tree(
            &mut tree,
            "width",
            StyleValue::Ternary {
                test: make_ident("cond"),
                consequent: Box::new(StyleValue::Primitive(StaticValue::Number(200.0))),
                alternate: Box::new(StyleValue::Primitive(StaticValue::Number(400.0))),
            },
        );

        // Both ternaries should be grouped under the same key
        assert_eq!(tree.ternaries.len(), 1);
        let branch = tree.ternaries.values().next().unwrap();
        // Consequent tree should have both color and width
        assert_eq!(branch.consequent.styles.len(), 2);
        assert_eq!(branch.alternate.styles.len(), 2);
    }
}
