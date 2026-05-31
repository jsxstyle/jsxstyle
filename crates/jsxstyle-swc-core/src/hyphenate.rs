use std::borrow::Cow;

/// Convert a camelCase CSS property name to kebab-case.
///
/// Special case: `ms` prefix becomes `-ms-` (vendor prefix).
/// Must match `@jsxstyle/core/src/hyphenateStyleName.ts` exactly.
///
/// The JS implementation:
/// ```js
/// styleName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^ms-/, '-ms-')
/// ```
pub fn hyphenate_style_name(name: &str) -> Cow<'_, str> {
    // Fast path: no uppercase chars means no hyphenation needed
    if !name.as_bytes().iter().any(|b| b.is_ascii_uppercase()) {
        return Cow::Borrowed(name);
    }

    let mut result = String::with_capacity(name.len() + 4);
    for ch in name.chars() {
        if ch.is_ascii_uppercase() {
            result.push('-');
            result.push(ch.to_ascii_lowercase());
        } else {
            result.push(ch);
        }
    }
    // Handle ms- vendor prefix: ms-xxx -> -ms-xxx
    if result.starts_with("ms-") {
        result.insert(0, '-');
    }
    Cow::Owned(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_properties() {
        assert_eq!(hyphenate_style_name("color"), "color");
        assert_eq!(hyphenate_style_name("display"), "display");
        assert_eq!(hyphenate_style_name("width"), "width");
    }

    #[test]
    fn test_camel_case() {
        assert_eq!(hyphenate_style_name("fontSize"), "font-size");
        assert_eq!(hyphenate_style_name("backgroundColor"), "background-color");
        assert_eq!(hyphenate_style_name("borderTopWidth"), "border-top-width");
        assert_eq!(hyphenate_style_name("flexDirection"), "flex-direction");
        assert_eq!(hyphenate_style_name("alignItems"), "align-items");
    }

    #[test]
    fn test_ms_vendor_prefix() {
        assert_eq!(hyphenate_style_name("msFlexGrow"), "-ms-flex-grow");
        assert_eq!(hyphenate_style_name("msGridColumn"), "-ms-grid-column");
    }

    #[test]
    fn test_webkit_vendor_prefix() {
        // Webkit prefixes start with uppercase, so they get a dash
        assert_eq!(hyphenate_style_name("WebkitFlex"), "-webkit-flex");
    }

    #[test]
    fn test_moz_vendor_prefix() {
        assert_eq!(hyphenate_style_name("MozBoxFlex"), "-moz-box-flex");
    }

    #[test]
    fn test_empty_string() {
        assert_eq!(hyphenate_style_name(""), "");
    }

    #[test]
    fn test_single_char_lowercase() {
        assert_eq!(hyphenate_style_name("x"), "x");
    }

    #[test]
    fn test_single_char_uppercase() {
        assert_eq!(hyphenate_style_name("X"), "-x");
    }

    #[test]
    fn test_all_uppercase() {
        assert_eq!(hyphenate_style_name("ABC"), "-a-b-c");
    }

    #[test]
    fn test_cow_borrowed_path() {
        // All-lowercase should return Cow::Borrowed (no allocation)
        let result = hyphenate_style_name("color");
        assert!(matches!(result, std::borrow::Cow::Borrowed(_)));
    }

    #[test]
    fn test_cow_owned_path() {
        // CamelCase should return Cow::Owned (allocates)
        let result = hyphenate_style_name("fontSize");
        assert!(matches!(result, std::borrow::Cow::Owned(_)));
    }
}
