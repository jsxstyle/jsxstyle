mod binding_resolver;
mod css_gen;
mod custom_properties;
mod dangerous_style_value;
mod generated_constants;
mod hyphenate;
pub(crate) mod import_tracker;
mod jsx_rewriter;
mod match_media;
mod prop_classifier;
mod static_eval;
pub(crate) mod ternary;
mod types;
mod visitor;

use swc_core::ecma::ast::Pass;
use swc_core::ecma::visit::visit_mut_pass;

pub use css_gen::{ClassNameGenerator, ClassNameStrategy};
pub use types::{StaticValue, TransformResult};
pub use visitor::NoRuntimeMode;
pub use visitor::TransformVisitor;

/// Create a transform pass from the visitor.
/// This is the entry point used by the NAPI binding.
/// The pass wraps a TransformVisitor and applies it via VisitMut.
pub fn create_transform() -> impl Pass {
    visit_mut_pass(TransformVisitor::default())
}

/// Create a TransformVisitor directly, for use cases where the caller
/// needs access to the visitor after transformation (e.g., to get CSS output).
pub fn create_transform_with_css() -> TransformVisitor {
    TransformVisitor::default()
}

/// Create a TransformVisitor with a custom class name generation function.
/// Used by tests and legacy code paths. Backward compatible.
pub fn create_transform_with_class_name_fn(
    class_name_fn: Box<dyn Fn(&str) -> String>,
) -> TransformVisitor {
    TransformVisitor {
        class_name_fn,
        ..Default::default()
    }
}

/// Create a TransformVisitor with Rust-side class name generation.
///
/// This is the new API that eliminates JS callback overhead. Class names
/// are generated entirely in Rust using the specified strategy.
///
/// # Arguments
/// * `strategy` - Counter (sequential) or Hash (content-based)
/// * `prefix` - Prefix for generated class names (e.g., "_x")
/// * `debug` - If true, generate debug-friendly class names
/// * `cache` - Pre-populated cache (from NAPI deserialization)
pub fn create_transform_with_options(
    strategy: ClassNameStrategy,
    prefix: String,
    debug: bool,
    cache: std::collections::HashMap<String, String>,
) -> TransformVisitor {
    let gen = ClassNameGenerator::new(strategy, prefix, debug, cache);
    TransformVisitor {
        class_name_gen: Some(gen),
        ..Default::default()
    }
}
