use rustc_hash::FxHashMap;

use swc_core::common::SyntaxContext;
use swc_core::ecma::ast::{Id, ImportDecl, ImportSpecifier, Module, ModuleDecl, ModuleItem};

use crate::generated_constants::{JSXSTYLE_SOURCES, KNOWN_NON_COMPONENT_IMPORTS, VALID_COMPONENTS};

/// The kind of a non-component import from jsxstyle packages.
#[derive(Debug, Clone, PartialEq)]
pub enum NonComponentImport {
    UseMatchMedia,
    MakeCustomProperties,
    Css,
}

/// A tracked non-component import with its local binding name and SyntaxContext.
#[derive(Debug, Clone)]
pub struct NonComponentImportEntry {
    pub kind: NonComponentImport,
    pub local_sym: String,
    pub local_ctxt: SyntaxContext,
}

/// Result of scanning a module for jsxstyle imports.
pub struct ImportScanResult {
    /// Which jsxstyle package was imported (e.g., "@jsxstyle/react").
    pub jsxstyle_source: String,
    /// Map from local binding Id (Atom, SyntaxContext) to imported component name.
    pub valid_components: FxHashMap<Id, String>,
    /// The className prop name: "className" for react/solid, "class" for preact.
    pub class_prop_name: &'static str,
    /// Index of the jsxstyle import declaration in module.body (for Box injection).
    pub import_decl_index: usize,
    /// Whether Box is already imported (no need to inject).
    pub has_box_import: bool,
    /// Tracked non-component imports with local names and SyntaxContext.
    pub non_component_imports: Vec<NonComponentImportEntry>,
}

/// Scan a module's imports for jsxstyle component imports.
///
/// Returns `None` if no jsxstyle import is found, meaning no transformation is needed.
pub fn scan_imports(module: &Module) -> Option<ImportScanResult> {
    let mut jsxstyle_source: Option<String> = None;
    let mut valid_components: FxHashMap<Id, String> = FxHashMap::default();
    let mut class_prop_name: &'static str = "className";
    let mut import_decl_index: usize = 0;
    let mut has_box_import = false;
    let mut non_component_imports: Vec<NonComponentImportEntry> = Vec::new();

    for (idx, item) in module.body.iter().enumerate() {
        let import_decl = match item {
            ModuleItem::ModuleDecl(ModuleDecl::Import(import_decl)) => import_decl,
            _ => continue,
        };

        // src.value is Wtf8Atom, use as_str() to get &str
        let source_str = match import_decl.src.value.as_str() {
            Some(s) => s,
            None => continue,
        };

        if !JSXSTYLE_SOURCES.contains(&source_str) {
            continue;
        }

        jsxstyle_source = Some(source_str.to_string());
        import_decl_index = idx;

        // Determine class prop name based on source package
        if source_str == "@jsxstyle/preact" {
            class_prop_name = "class";
        }
        // react and solid both use "className" (the default)

        process_import_specifiers(
            import_decl,
            &mut valid_components,
            &mut has_box_import,
            &mut non_component_imports,
        );
    }

    let source = jsxstyle_source?;

    Some(ImportScanResult {
        jsxstyle_source: source,
        valid_components,
        class_prop_name,
        import_decl_index,
        has_box_import,
        non_component_imports,
    })
}

/// Process import specifiers from a jsxstyle import declaration.
fn process_import_specifiers(
    import_decl: &ImportDecl,
    valid_components: &mut FxHashMap<Id, String>,
    has_box_import: &mut bool,
    non_component_imports: &mut Vec<NonComponentImportEntry>,
) {
    for specifier in &import_decl.specifiers {
        if let ImportSpecifier::Named(named) = specifier {
            // The imported name is the original component name
            let imported_name = match &named.imported {
                Some(swc_core::ecma::ast::ModuleExportName::Ident(id)) => {
                    id.sym.as_ref().to_string()
                }
                Some(swc_core::ecma::ast::ModuleExportName::Str(s)) => {
                    // Str.value is Wtf8Atom
                    match s.value.as_str() {
                        Some(v) => v.to_string(),
                        None => continue,
                    }
                }
                None => named.local.sym.as_ref().to_string(),
            };

            // Track valid jsxstyle component names
            if VALID_COMPONENTS.contains(&imported_name.as_str()) {
                if imported_name == "Box" {
                    *has_box_import = true;
                }
                valid_components.insert(named.local.to_id(), imported_name);
            } else if KNOWN_NON_COMPONENT_IMPORTS.contains(&imported_name.as_str()) {
                // Track non-component imports with local name and SyntaxContext.
                // Local name may differ from imported name (e.g., `import { useMatchMedia as useMM }`).
                let kind = match imported_name.as_str() {
                    "useMatchMedia" => NonComponentImport::UseMatchMedia,
                    "makeCustomProperties" => NonComponentImport::MakeCustomProperties,
                    "css" => NonComponentImport::Css,
                    _ => continue,
                };
                non_component_imports.push(NonComponentImportEntry {
                    kind,
                    local_sym: named.local.sym.as_ref().to_string(),
                    local_ctxt: named.local.ctxt,
                });
            }
        }
    }
}
