use indexmap::IndexMap;
use rustc_hash::FxHashMap;

use swc_core::ecma::ast::{
    Decl, ExportSpecifier, Id, Module, ModuleDecl, ModuleExportName, ModuleItem, ObjectPatProp,
    Pat, Stmt, VarDeclKind,
};

use crate::static_eval::evaluate_expr;
use crate::types::{atom_to_string, StaticValue};

/// Collect const bindings from top-level declarations in a module.
///
/// Walks `module.body` for top-level `const` variable declarations,
/// evaluates their initializers statically, and returns a map of
/// binding Id -> StaticValue.
///
/// Handles:
/// - Simple `const x = <expr>` bindings with Pat::Ident
/// - Object destructuring `const { a, b } = <expr>` with Pat::Object
///   when the initializer evaluates to a StaticValue::Object
///
/// Per research recommendation: starts with top-level `const` only
/// (covers 90% of use cases). Block-scoped bindings can be added later.
pub fn collect_const_bindings(module: &Module) -> FxHashMap<Id, StaticValue> {
    let mut bindings = FxHashMap::default();

    for item in &module.body {
        let var_decl = match item {
            ModuleItem::Stmt(Stmt::Decl(Decl::Var(var_decl))) => var_decl,
            _ => continue,
        };

        if var_decl.kind != VarDeclKind::Const {
            continue;
        }

        for decl in &var_decl.decls {
            let init = match &decl.init {
                Some(init) => init,
                None => continue,
            };

            match &decl.name {
                // Simple binding: const x = <expr>
                Pat::Ident(bind_ident) => {
                    // Pass already-collected bindings so earlier const declarations
                    // can be referenced by later ones
                    if let Some(value) = evaluate_expr(init, &bindings) {
                        bindings.insert(bind_ident.to_id(), value);
                    }
                }

                // Object destructuring: const { a, b } = <expr>
                Pat::Object(obj_pat) => {
                    if let Some(StaticValue::Object(obj_map)) = evaluate_expr(init, &bindings) {
                        for prop in &obj_pat.props {
                            match prop {
                                ObjectPatProp::KeyValue(kv) => {
                                    // const { key: localName } = obj
                                    let key = extract_prop_name_str(&kv.key);
                                    if let (Some(key_str), Pat::Ident(local)) =
                                        (key, kv.value.as_ref())
                                    {
                                        if let Some(val) = obj_map.get(&key_str) {
                                            bindings.insert(local.to_id(), val.clone());
                                        }
                                    }
                                }
                                ObjectPatProp::Assign(assign) => {
                                    // const { key } = obj (shorthand)
                                    let key_str = assign.key.sym.as_ref().to_string();
                                    if let Some(val) = obj_map.get(&key_str) {
                                        bindings.insert(assign.key.to_id(), val.clone());
                                    }
                                    // If not in obj and there's a default value, we could
                                    // evaluate it, but for now we skip default values.
                                }
                                ObjectPatProp::Rest(_) => {
                                    // Rest patterns (...rest) are more complex; skip for now
                                }
                            }
                        }
                    }
                }

                // Other patterns (array, assign, etc.) not supported yet
                _ => {}
            }
        }
    }

    bindings
}

/// Collect exported bindings from a module, using the already-collected const bindings
/// for evaluation. Returns a map of export name → StaticValue for all successfully
/// evaluated exports.
///
/// Handles:
/// - `export const X = <expr>` (ExportDecl with VarDecl)
/// - `export { X }` and `export { X as Y }` (NamedExport without src)
/// - `export default <expr>` (ExportDefaultExpr, keyed as "default")
///
/// Only includes exports whose values can be statically evaluated.
pub fn collect_exported_bindings(
    module: &Module,
    const_bindings: &FxHashMap<Id, StaticValue>,
) -> IndexMap<String, StaticValue> {
    let mut exports = IndexMap::new();

    for item in &module.body {
        match item {
            // export const X = <expr>
            ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(export_decl)) => {
                if let Decl::Var(var_decl) = &export_decl.decl {
                    if var_decl.kind != VarDeclKind::Const {
                        continue;
                    }
                    for decl in &var_decl.decls {
                        if let Some(init) = &decl.init {
                            match &decl.name {
                                Pat::Ident(bind_ident) => {
                                    if let Some(value) = evaluate_expr(init, const_bindings) {
                                        let name = bind_ident.sym.as_ref().to_string();
                                        exports.insert(name, value);
                                    }
                                }
                                Pat::Object(obj_pat) => {
                                    if let Some(StaticValue::Object(obj_map)) =
                                        evaluate_expr(init, const_bindings)
                                    {
                                        for prop in &obj_pat.props {
                                            match prop {
                                                ObjectPatProp::KeyValue(kv) => {
                                                    let key = extract_prop_name_str(&kv.key);
                                                    if let (Some(key_str), Pat::Ident(local)) =
                                                        (key, kv.value.as_ref())
                                                    {
                                                        if let Some(val) = obj_map.get(&key_str) {
                                                            let name =
                                                                local.sym.as_ref().to_string();
                                                            exports.insert(name, val.clone());
                                                        }
                                                    }
                                                }
                                                ObjectPatProp::Assign(assign) => {
                                                    let key_str =
                                                        assign.key.sym.as_ref().to_string();
                                                    if let Some(val) = obj_map.get(&key_str) {
                                                        exports.insert(key_str, val.clone());
                                                    }
                                                }
                                                ObjectPatProp::Rest(_) => {}
                                            }
                                        }
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }

            // export { X } or export { X as Y } (without `from`)
            ModuleItem::ModuleDecl(ModuleDecl::ExportNamed(named_export)) => {
                // Skip re-exports (export { X } from './other')
                if named_export.src.is_some() {
                    continue;
                }
                for spec in &named_export.specifiers {
                    if let ExportSpecifier::Named(named) = spec {
                        // The local name (what we look up in const_bindings)
                        let local_id = match &named.orig {
                            ModuleExportName::Ident(id) => id.to_id(),
                            ModuleExportName::Str(_) => continue,
                        };

                        // The exported name (what consumers see)
                        let export_name = match &named.exported {
                            Some(ModuleExportName::Ident(id)) => id.sym.as_ref().to_string(),
                            Some(ModuleExportName::Str(s)) => atom_to_string(&s.value),
                            None => match &named.orig {
                                ModuleExportName::Ident(id) => id.sym.as_ref().to_string(),
                                ModuleExportName::Str(s) => atom_to_string(&s.value),
                            },
                        };

                        if let Some(value) = const_bindings.get(&local_id) {
                            exports.insert(export_name, value.clone());
                        }
                    }
                }
            }

            // export default <expr>
            ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(export_default)) => {
                if let Some(value) = evaluate_expr(&export_default.expr, const_bindings) {
                    exports.insert("default".to_string(), value);
                }
            }

            _ => {}
        }
    }

    exports
}

/// Extract a string from a PropName (for destructuring key extraction).
fn extract_prop_name_str(key: &swc_core::ecma::ast::PropName) -> Option<String> {
    match key {
        swc_core::ecma::ast::PropName::Ident(id) => Some(id.sym.as_ref().to_string()),
        swc_core::ecma::ast::PropName::Str(s) => Some(atom_to_string(&s.value)),
        swc_core::ecma::ast::PropName::Num(n) => {
            if n.value.fract() == 0.0 {
                Some(format!("{}", n.value as i64))
            } else {
                Some(format!("{}", n.value))
            }
        }
        _ => None,
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

    fn parse_module(source: &str) -> Module {
        GLOBALS.set(&Default::default(), || {
            let cm: Lrc<SourceMap> = Lrc::new(SourceMap::default());
            let fm = cm.new_source_file(
                FileName::Custom("test.ts".to_string()).into(),
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
            module
        })
    }

    #[test]
    fn test_export_const_simple() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("export const SPACING = 8;");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert_eq!(exports.get("SPACING"), Some(&StaticValue::Number(8.0)));
            assert_eq!(exports.len(), 1);
        });
    }

    #[test]
    fn test_export_const_multiple() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module(
                "export const A = 'hello'; export const B = 42; export const C = true;",
            );
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert_eq!(
                exports.get("A"),
                Some(&StaticValue::String("hello".to_string()))
            );
            assert_eq!(exports.get("B"), Some(&StaticValue::Number(42.0)));
            assert_eq!(exports.get("C"), Some(&StaticValue::Bool(true)));
        });
    }

    #[test]
    fn test_export_named_from_const() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("const SPACING = 8; export { SPACING };");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert_eq!(exports.get("SPACING"), Some(&StaticValue::Number(8.0)));
        });
    }

    #[test]
    fn test_export_named_with_rename() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("const X = 'foo'; export { X as Y };");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            // Should be keyed by the exported name "Y", not the local "X"
            assert_eq!(
                exports.get("Y"),
                Some(&StaticValue::String("foo".to_string()))
            );
            assert_eq!(exports.get("X"), None);
        });
    }

    #[test]
    fn test_export_default_expr() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("export default { color: 'red', size: 16 };");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            let default_val = exports.get("default").unwrap();
            match default_val {
                StaticValue::Object(obj) => {
                    assert_eq!(
                        obj.get("color"),
                        Some(&StaticValue::String("red".to_string()))
                    );
                    assert_eq!(obj.get("size"), Some(&StaticValue::Number(16.0)));
                }
                _ => panic!("Expected Object, got {:?}", default_val),
            }
        });
    }

    #[test]
    fn test_non_const_not_exported() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("export let X = 5; export var Y = 10;");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            // let and var are not collected
            assert!(exports.is_empty());
        });
    }

    #[test]
    fn test_unexported_const_not_in_exports() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("const INTERNAL = 42; export const PUBLIC = 1;");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert_eq!(exports.get("PUBLIC"), Some(&StaticValue::Number(1.0)));
            assert_eq!(exports.get("INTERNAL"), None);
        });
    }

    #[test]
    fn test_export_const_with_expression() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("export const DOUBLE = 4 * 2;");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert_eq!(exports.get("DOUBLE"), Some(&StaticValue::Number(8.0)));
        });
    }

    #[test]
    fn test_non_evaluable_export_omitted() {
        GLOBALS.set(&Default::default(), || {
            let module = parse_module("export const X = someFunction();");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert!(exports.is_empty());
        });
    }

    #[test]
    fn test_re_export_skipped() {
        GLOBALS.set(&Default::default(), || {
            // Re-exports with `from` should be skipped
            let module = parse_module("export { X } from './other';");
            let bindings = collect_const_bindings(&module);
            let exports = collect_exported_bindings(&module, &bindings);
            assert!(exports.is_empty());
        });
    }
}
