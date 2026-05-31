//! Shared types for the jsxstyle SWC transform.

use indexmap::IndexMap;

use swc_core::atoms::Wtf8Atom;
use swc_core::ecma::ast::Expr;

/// Convert a WTF-8 atom (SWC's `Str.value` type) to an owned String.
///
/// Uses `as_str()` for the fast path when the atom is valid UTF-8,
/// falling back to `to_string_lossy()` for atoms with unpaired surrogates.
#[inline]
pub fn atom_to_string(atom: &Wtf8Atom) -> String {
    match atom.as_str() {
        Some(v) => v.to_string(),
        None => atom.to_string_lossy().into_owned(),
    }
}

/// A statically evaluated value from a JSX attribute expression.
#[derive(Debug, Clone, PartialEq)]
pub enum StaticValue {
    String(String),
    Number(f64),
    Bool(bool),
    Null,
    Undefined,
    /// An object with string keys and static values.
    /// Uses IndexMap to preserve insertion order (matching JS object property ordering).
    /// This is critical for Babel output parity.
    Object(IndexMap<String, StaticValue>),
}

/// A generated CSS rule.
#[derive(Debug, Clone)]
pub struct CssRule {
    pub rule: String,
}

/// The result of transforming a source file.
#[derive(Debug, Clone)]
pub struct TransformResult {
    pub code: String,
    pub css: String,
}

/// A part of a className expression, either a static string or a conditional.
///
/// Used to build className expressions that include ternary conditions:
/// e.g., `"_x0 " + (dynamic ? "_x1" : "_x2")`
#[derive(Debug, Clone)]
pub enum ClassNamePart {
    /// A static class name string (one or more class names, space-separated).
    Static(String),
    /// A conditional class name expression with two branches.
    Ternary {
        test: Box<Expr>,
        consequent: Vec<ClassNamePart>,
        alternate: Vec<ClassNamePart>,
    },
}
