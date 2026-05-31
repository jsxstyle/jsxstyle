//! useMatchMedia hook extraction for jsxstyle.
//!
//! Ports the Babel extractor's useMatchMedia handling:
//! - Renames bindings with `useMatchMedia_` prefix
//! - Adds `/*#__PURE__*/` comment to call expressions for tree-shaking
//! - Populates a media query map that the JSX visitor uses for ternary interception

use rustc_hash::FxHashMap;

use swc_core::common::comments::{Comment, CommentKind, Comments};
use swc_core::common::{SyntaxContext, DUMMY_SP};
use swc_core::ecma::ast::{CallExpr, Callee, Expr, Ident, Module, Pat, VarDeclarator};
use swc_core::ecma::visit::{Visit, VisitMut, VisitMutWith, VisitWith};

use crate::import_tracker::NonComponentImportEntry;
use crate::types::atom_to_string;

/// A rename entry: (old_sym, old_ctxt, new_sym).
pub struct RenameEntry {
    pub old_sym: String,
    pub old_ctxt: SyntaxContext,
    pub new_sym: String,
}

/// Process useMatchMedia call expressions in the module.
///
/// Recursively walks the full AST looking for `const x = useMatchMedia('query')` patterns.
/// For each match:
/// - Records `useMatchMedia_x -> "query"` in `media_queries_by_key`
/// - Returns rename entries to apply later
pub fn process_use_match_media(
    module: &Module,
    use_match_media_imports: &[&NonComponentImportEntry],
    media_queries_by_key: &mut FxHashMap<String, String>,
) -> Vec<RenameEntry> {
    let mut finder = UseMatchMediaFinder {
        use_match_media_imports,
        renames: Vec::new(),
        media_queries_by_key,
    };
    module.visit_with(&mut finder);
    finder.renames
}

/// A Visit (read-only) implementation that finds useMatchMedia variable declarators.
struct UseMatchMediaFinder<'a> {
    use_match_media_imports: &'a [&'a NonComponentImportEntry],
    renames: Vec<RenameEntry>,
    media_queries_by_key: &'a mut FxHashMap<String, String>,
}

impl Visit for UseMatchMediaFinder<'_> {
    fn visit_var_declarator(&mut self, declarator: &VarDeclarator) {
        // Recurse into children first (so we find nested useMatchMedia calls)
        declarator.visit_children_with(self);

        // Must have an initializer
        let init = match &declarator.init {
            Some(init) => init,
            None => return,
        };

        // Initializer must be a CallExpression
        let call = match init.as_ref() {
            Expr::Call(call) => call,
            _ => return,
        };

        // Callee must be an Ident matching a useMatchMedia import
        let callee_ident = match &call.callee {
            Callee::Expr(expr) => match expr.as_ref() {
                Expr::Ident(id) => id,
                _ => return,
            },
            _ => return,
        };

        let is_match_media = self.use_match_media_imports.iter().any(|entry| {
            entry.local_sym == callee_ident.sym.as_ref() && entry.local_ctxt == callee_ident.ctxt
        });

        if !is_match_media {
            return;
        }

        // Must have exactly 1 argument
        if call.args.len() != 1 {
            return;
        }

        // Argument must be a string literal
        let media_query = match call.args[0].expr.as_ref() {
            Expr::Lit(swc_core::ecma::ast::Lit::Str(s)) => atom_to_string(&s.value),
            _ => return,
        };

        // Binding pattern must be a simple Identifier
        let binding_ident = match &declarator.name {
            Pat::Ident(binding) => binding,
            _ => return,
        };

        let old_sym = binding_ident.sym.as_ref().to_string();
        let old_ctxt = binding_ident.ctxt;
        let new_sym = format!("useMatchMedia_{}", old_sym);

        // Record rename and media query mapping
        self.media_queries_by_key
            .insert(new_sym.clone(), media_query);
        self.renames.push(RenameEntry {
            old_sym,
            old_ctxt,
            new_sym,
        });
    }
}

/// Apply identifier renames throughout the module AST.
///
/// Walks all Ident nodes and renames those matching (old_sym, old_ctxt) to new_sym.
pub fn apply_renames(module: &mut Module, renames: &[RenameEntry]) {
    if renames.is_empty() {
        return;
    }
    let mut renamer = IdentRenamer { renames };
    module.visit_mut_with(&mut renamer);
}

/// A VisitMut implementation that renames identifiers matching the rename entries.
struct IdentRenamer<'a> {
    renames: &'a [RenameEntry],
}

impl VisitMut for IdentRenamer<'_> {
    fn visit_mut_ident(&mut self, ident: &mut Ident) {
        let sym = ident.sym.as_ref();
        for rename in self.renames {
            if sym == rename.old_sym && ident.ctxt == rename.old_ctxt {
                ident.sym = rename.new_sym.as_str().into();
                break;
            }
        }
    }
}

/// Add `/*#__PURE__*/` leading comments to all useMatchMedia call expressions.
///
/// This must be called AFTER renaming, so that the comment attaches to the correct span.
pub fn add_pure_comments(
    module: &mut Module,
    use_match_media_imports: &[&NonComponentImportEntry],
    comments: &dyn Comments,
) {
    let mut adder = PureCommentAdder {
        use_match_media_imports,
        comments,
    };
    module.visit_mut_with(&mut adder);
}

/// A VisitMut that adds PURE comments to useMatchMedia call expressions.
struct PureCommentAdder<'a> {
    use_match_media_imports: &'a [&'a NonComponentImportEntry],
    comments: &'a dyn Comments,
}

impl VisitMut for PureCommentAdder<'_> {
    fn visit_mut_call_expr(&mut self, call: &mut CallExpr) {
        // Recurse first
        call.visit_mut_children_with(self);

        // Check if callee is an Ident matching a useMatchMedia import.
        // After renaming, the callee sym has changed but SyntaxContext remains the same.
        let callee_ident = match &call.callee {
            Callee::Expr(expr) => match expr.as_ref() {
                Expr::Ident(id) => id,
                _ => return,
            },
            _ => return,
        };

        // Match by SyntaxContext and the renamed "useMatchMedia_*" pattern,
        // or by the original import name (the import specifier itself is also renamed).
        let is_match_media = self.use_match_media_imports.iter().any(|entry| {
            entry.local_ctxt == callee_ident.ctxt
                && (callee_ident.sym.as_ref().starts_with("useMatchMedia_")
                    || entry.local_sym == callee_ident.sym.as_ref())
        });

        if !is_match_media {
            return;
        }

        // Add /*#__PURE__*/ leading comment
        self.comments.add_leading(
            call.span.lo,
            Comment {
                kind: CommentKind::Block,
                span: DUMMY_SP,
                text: "#__PURE__".into(),
            },
        );
    }
}
