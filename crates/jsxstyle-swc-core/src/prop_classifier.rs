//! Prop classification for jsxstyle components.
//!
//! Classifies props into:
//! - Component props: HTML attributes that pass through to the DOM element
//! - Skipped props: consumed by the extractor (component, mediaQueries, props)
//! - Event handlers: /^on[A-Z]/
//! - Style props: everything else

use crate::generated_constants::{COMMON_COMPONENT_PROPS, SKIPPED_PROPS};

/// Check if a prop name is a known component prop (not a style prop).
///
/// A prop is a component prop if it is:
/// - A common HTML attribute (from `commonComponentProps`)
/// - A skipped prop consumed by the extractor (component, mediaQueries, props)
/// - "key" or "ref" (framework-specific, always pass through)
/// - An event handler (/^on[A-Z]/)
pub fn is_component_prop(name: &str) -> bool {
    COMMON_COMPONENT_PROPS.binary_search(&name).is_ok()
        || SKIPPED_PROPS.binary_search(&name).is_ok()
        || name == "key"
        || name == "ref"
        || is_event_handler(name)
}

/// Check if a prop name is an event handler (starts with "on" followed by an uppercase letter).
pub fn is_event_handler(name: &str) -> bool {
    name.len() >= 3
        && name.as_bytes()[0] == b'o'
        && name.as_bytes()[1] == b'n'
        && name.as_bytes()[2].is_ascii_uppercase()
}

/// Check if a prop is consumed by the extractor itself (not passed to the output element).
/// These are: component, mediaQueries, props.
pub fn is_skipped_prop(name: &str) -> bool {
    SKIPPED_PROPS.binary_search(&name).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_component_props() {
        assert!(is_component_prop("children"));
        assert!(is_component_prop("className"));
        assert!(is_component_prop("class"));
        assert!(is_component_prop("component"));
        assert!(is_component_prop("id"));
        assert!(is_component_prop("key"));
        assert!(is_component_prop("ref"));
        assert!(is_component_prop("style"));
        assert!(is_component_prop("href"));
        assert!(is_component_prop("disabled"));
        assert!(is_component_prop("checked"));
        assert!(is_component_prop("name"));
        assert!(is_component_prop("placeholder"));
        assert!(is_component_prop("props"));
        assert!(is_component_prop("type"));
        assert!(is_component_prop("value"));
        assert!(is_component_prop("mediaQueries"));
        // HTML attributes from commonComponentProps
        assert!(is_component_prop("alt"));
        assert!(is_component_prop("slot"));
        assert!(is_component_prop("src"));
        assert!(is_component_prop("title"));
    }

    #[test]
    fn test_event_handlers() {
        assert!(is_event_handler("onClick"));
        assert!(is_event_handler("onMouseEnter"));
        assert!(is_event_handler("onChange"));
        assert!(!is_event_handler("on"));
        assert!(!is_event_handler("onclick")); // lowercase after "on"
        assert!(!is_event_handler("online")); // not an event handler
    }

    #[test]
    fn test_style_props() {
        assert!(!is_component_prop("color"));
        assert!(!is_component_prop("display"));
        assert!(!is_component_prop("width"));
        assert!(!is_component_prop("flexDirection"));
        assert!(!is_component_prop("margin"));
        assert!(!is_component_prop("padding"));
    }

    #[test]
    fn test_skipped_props() {
        assert!(is_skipped_prop("component"));
        assert!(is_skipped_prop("mediaQueries"));
        assert!(is_skipped_prop("props"));
        assert!(!is_skipped_prop("className"));
        assert!(!is_skipped_prop("color"));
    }

    #[test]
    fn test_data_attributes_are_not_component_props() {
        // data-* attributes are NOT in the known component props set
        // They get treated as style props and will fail evaluation -> pass through
        assert!(!is_component_prop("data-testid"));
        assert!(!is_component_prop("data-value"));
    }

    #[test]
    fn test_event_handler_edge_cases() {
        // Empty string
        assert!(!is_event_handler(""));
        // Single char
        assert!(!is_event_handler("o"));
        // Two chars
        assert!(!is_event_handler("on"));
        // Three chars with lowercase third
        assert!(!is_event_handler("ona"));
        // Three chars with uppercase third (minimum valid event handler)
        assert!(is_event_handler("onA"));
        // Non-ASCII-uppercase third char
        assert!(!is_event_handler("on1"));
    }
}
