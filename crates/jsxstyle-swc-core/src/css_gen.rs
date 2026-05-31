use rustc_hash::FxHashMap;

use crate::generated_constants::{DOUBLE_SPECIFICITY_PREFIXES, PSEUDOCLASSES, PSEUDOELEMENTS};
use crate::hyphenate::hyphenate_style_name;

pub use crate::generated_constants::expand_shorthand;

/// Strategy for generating class names from style keys.
#[derive(Debug, Clone, PartialEq)]
pub enum ClassNameStrategy {
    /// Sequential counter: {prefix}{counter_base36} (e.g., `_x0`, `_x1`)
    Counter,
    /// Content-based hash: {prefix}{string_hash_base36} (e.g., `_xk1a9v`)
    Hash,
}

/// Configurable class name generator that supports counter and hash strategies.
///
/// Maintains a cache of `key -> className` mappings. Pre-populated caches can
/// be provided from NAPI deserialization for persistent class names across builds.
pub struct ClassNameGenerator {
    strategy: ClassNameStrategy,
    prefix: String,
    debug: bool,
    cache: FxHashMap<String, String>,
    counter: usize,
}

impl ClassNameGenerator {
    /// Create a new class name generator with the given configuration.
    ///
    /// # Arguments
    /// * `strategy` - Counter (sequential) or Hash (content-based)
    /// * `prefix` - Prefix for generated class names (e.g., "_x")
    /// * `debug` - If true, generate debug-friendly class names based on the key
    /// * `cache` - Pre-populated cache (from NAPI deserialization)
    pub fn new(
        strategy: ClassNameStrategy,
        prefix: String,
        debug: bool,
        cache: std::collections::HashMap<String, String>,
    ) -> Self {
        // Start counter after any pre-existing cache entries
        let counter = cache.len();
        Self {
            strategy,
            prefix,
            debug,
            cache: cache.into_iter().collect(),
            counter,
        }
    }

    /// Get or generate a class name for the given style key.
    ///
    /// Checks the cache first; generates and caches if missing.
    pub fn get_class_name(&mut self, key: &str) -> String {
        if let Some(cached) = self.cache.get(key) {
            return cached.clone();
        }

        let class_name = if self.debug {
            // Debug mode: {prefix}-{key_sanitized}
            let sanitized = key
                .replace([':', ' ', '.'], "-")
                .replace(['(', ')'], "")
                .replace('@', "at-")
                .replace('&', "amp")
                .chars()
                .take(60)
                .collect::<String>();
            format!("{}-{}", self.prefix, sanitized)
        } else {
            match self.strategy {
                ClassNameStrategy::Counter => {
                    let name = format!("{}{}", self.prefix, radix_36(self.counter as u32));
                    self.counter += 1;
                    name
                }
                ClassNameStrategy::Hash => {
                    format!("{}{}", self.prefix, radix_36(string_hash(key)))
                }
            }
        };

        self.cache.insert(key.to_string(), class_name.clone());
        class_name
    }

    /// Consume the generator and return the final cache for NAPI serialization back to JS.
    pub fn into_cache(self) -> std::collections::HashMap<String, String> {
        self.cache.into_iter().collect()
    }
}

/// DJB2a hash -- MUST match the JS implementation in @jsxstyle/core stringHash.ts.
///
/// The JS implementation iterates backwards:
/// ```js
/// let hash = 5381;
/// let i = str.length;
/// while (i) { hash = (hash * 33) ^ str.charCodeAt(--i); }
/// return hash >>> 0;
/// ```
///
/// We iterate bytes in reverse to match this behavior.
pub fn string_hash(s: &str) -> u32 {
    let mut hash: u32 = 5381;
    for &byte in s.as_bytes().iter().rev() {
        hash = hash.wrapping_mul(33) ^ (byte as u32);
    }
    hash
}

/// Convert a u32 to a base-36 string (digits 0-9, letters a-z).
pub fn radix_36(mut n: u32) -> String {
    if n == 0 {
        return "0".to_string();
    }
    const CHARS: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut result = Vec::new();
    while n > 0 {
        result.push(CHARS[(n % 36) as usize]);
        n /= 36;
    }
    result.reverse();
    String::from_utf8(result).expect("radix_36 only produces ASCII")
}

/// Generate a class name from a style key.
///
/// Format: "_" + base36(hash(key))
pub fn get_class_name(key: &str) -> String {
    format!("_{}", radix_36(string_hash(key)))
}

/// Result of parsing a jsxstyle prop name.
///
/// E.g., `hoverColor` -> pseudo_class="hover", css_prop_name="color", specificity=0
/// E.g., `placeholderHoverColor` -> pseudo_element="placeholder", pseudo_class="hover",
///        css_prop_name="color", specificity=0
/// E.g., `marginLeft` -> css_prop_name="marginLeft", specificity=1 (under "margin" prefix)
#[derive(Debug, Clone)]
pub struct ParsedProp {
    /// The actual CSS property name (camelCase, e.g., "color", "marginLeft").
    pub css_prop_name: String,
    /// Pseudo class, e.g., "hover", "active". Borrowed from PSEUDOCLASSES.
    pub pseudo_class: Option<&'static str>,
    /// Pseudo element, e.g., "placeholder", "before". Borrowed from PSEUDOELEMENTS.
    pub pseudo_element: Option<&'static str>,
    /// Base specificity from shorthand prefix analysis.
    /// 0 = normal, 1 = under a double-specificity prefix (margin, padding, etc.)
    pub specificity: u8,
}

/// Parse a jsxstyle prop name into its components (pseudo-class, pseudo-element,
/// CSS property name, specificity).
///
/// This implements the same algorithm as `parseStyleProps` in
/// `@jsxstyle/core/src/parseStyleProps.ts`.
///
/// The JS implementation uses a global regex `/[A-Z]/g` with `.test()` calls
/// that advance a cursor. We simulate this with a `CapRegex` helper that tracks
/// the last match position.
///
/// Algorithm:
/// 1. Find first capital letter -> extract prefix before it
/// 2. Check prefix against pseudoelements FIRST (after, before, placeholder, selection)
/// 3. If pseudoelement match: advance cursor, extract next prefix, check against pseudoclasses
/// 4. If no pseudoelement: check prefix against pseudoclasses
/// 5. Check (possibly advanced) prefix against double specificity prefixes
/// 6. The remaining part (from split_index) is the CSS property name (first char lowercased)
///
/// CRITICAL: split_index only advances inside pseudo blocks, NOT for specificity prefixes.
pub fn parse_prop_name(original_prop_name: &str) -> ParsedProp {
    debug_assert!(
        original_prop_name.is_ascii(),
        "parse_prop_name expects ASCII input, got: {original_prop_name}"
    );
    let mut pseudo_element: Option<&'static str> = None;
    let mut pseudo_class: Option<&'static str> = None;
    let mut specificity: u8 = 0;
    let mut split_index: usize = 0;

    // Simulate JS capRegex with lastIndex tracking
    let mut cursor = CapCursor::new(original_prop_name);

    // Step 1: Find first capital letter, extract prefix before it
    // JS: capRegex.test(originalPropName) && capRegex.lastIndex > 1
    let mut prop_name_prefix: Option<String> = if cursor.test() && cursor.last_index > 1 {
        Some(original_prop_name[..cursor.last_index - 1].to_string())
    } else {
        None
    };

    // Step 2: Check for pseudoelement prefix FIRST
    if let Some(ref prefix) = prop_name_prefix {
        if let Some(&matched) = PSEUDOELEMENTS.iter().find(|&&pe| pe == prefix.as_str()) {
            pseudo_element = Some(matched);
            // JS: splitIndex = capRegex.lastIndex - 1
            split_index = cursor.last_index - 1;

            // JS: capRegex.test(originalPropName) && lowercase(char at splitIndex) + slice
            prop_name_prefix = if cursor.test() {
                let si = split_index;
                let next_si = cursor.last_index - 1;
                let mut s = original_prop_name[si..si + 1].to_ascii_lowercase();
                s.push_str(&original_prop_name[si + 1..next_si]);
                Some(s)
            } else {
                // No next cap: prop_name_prefix = false (None)
                None
            };
        }
    }

    // Step 3: Check for pseudoclass prefix
    if let Some(ref prefix) = prop_name_prefix {
        if let Some(&matched) = PSEUDOCLASSES.iter().find(|&&pc| pc == prefix.as_str()) {
            pseudo_class = Some(matched);
            // JS: splitIndex = capRegex.lastIndex - 1
            split_index = cursor.last_index - 1;

            // JS: capRegex.test(originalPropName) && lowercase + slice
            prop_name_prefix = if cursor.test() {
                let si = split_index;
                let next_si = cursor.last_index - 1;
                let mut s = original_prop_name[si..si + 1].to_ascii_lowercase();
                s.push_str(&original_prop_name[si + 1..next_si]);
                Some(s)
            } else {
                None
            };
        }
    }

    // Step 4: Check if we need to bump specificity (double specificity prefixes)
    // This only checks prop_name_prefix -- does NOT advance split_index
    if let Some(ref prefix) = prop_name_prefix {
        if DOUBLE_SPECIFICITY_PREFIXES.contains(&prefix.as_str()) {
            specificity += 1;
        }
    }

    // Step 5: Build the CSS property name from split_index
    // JS: propName = originalPropName[splitIndex].toLowerCase() + originalPropName.slice(splitIndex + 1)
    let css_prop_name = if split_index > 0 {
        let mut s = original_prop_name[split_index..split_index + 1].to_ascii_lowercase();
        s.push_str(&original_prop_name[split_index + 1..]);
        s
    } else {
        original_prop_name.to_string()
    };

    ParsedProp {
        css_prop_name,
        pseudo_class,
        pseudo_element,
        specificity,
    }
}

/// Helper to simulate JS global regex `/[A-Z]/g` with `.test()` calls.
/// Each `.test()` call finds the next uppercase ASCII letter starting from `last_index`.
struct CapCursor<'a> {
    input: &'a str,
    last_index: usize,
}

impl<'a> CapCursor<'a> {
    fn new(input: &'a str) -> Self {
        CapCursor {
            input,
            last_index: 0,
        }
    }

    /// Find the next uppercase letter starting at `last_index`.
    /// If found, sets `last_index` to position AFTER the match (like JS RegExp.lastIndex).
    /// Returns true if a match was found.
    fn test(&mut self) -> bool {
        for (i, ch) in self.input[self.last_index..].char_indices() {
            if ch.is_ascii_uppercase() {
                self.last_index = self.last_index + i + 1; // position AFTER the match
                return true;
            }
        }
        false
    }
}

/// Generate a CSS rule string with full pseudo/specificity/media support.
///
/// Produces the full CSS rule including:
/// - Selector with specificity bumping (class name repeated)
/// - Pseudo class (`:hover`, `:active`, etc.)
/// - Pseudo element (`::placeholder`, `::before`, etc.)
/// - Media query wrapping (`@media (...) { ... }`)
///
/// The key used for class name hashing includes all context to ensure unique
/// class names for different pseudo/media combinations of the same property.
#[allow(clippy::too_many_arguments)]
pub fn generate_css_rule_full(
    class_name: &str,
    property: &str,
    value: &str,
    specificity: u8,
    pseudo_class: Option<&str>,
    pseudo_element: Option<&str>,
    query_string: Option<&str>,
    ampersand_string: Option<&str>,
) -> String {
    let hyphenated = hyphenate_style_name(property);

    // Build class name selector: .className repeated (specificity + 1) times + pseudo
    let mut class_selector = format!(".{class_name}");
    for _ in 0..specificity {
        class_selector.push('.');
        class_selector.push_str(class_name);
    }

    // Append pseudo class
    if let Some(pc) = pseudo_class {
        class_selector.push(':');
        class_selector.push_str(pc);
    }

    // Append pseudo element
    if let Some(pe) = pseudo_element {
        class_selector.push_str("::");
        class_selector.push_str(pe);
    }

    // Apply ampersand replacement: replace & in ampersand_string with class selector
    let selector = if let Some(amp) = ampersand_string {
        amp.replace('&', &class_selector)
    } else {
        class_selector
    };

    let rule_body = format!("{selector}{{{hyphenated}:{value}}}");

    // Wrap in query string if present
    if let Some(query) = query_string {
        format!("{query}{{{rule_body}}}")
    } else {
        rule_body
    }
}

/// Build the style key used for class name hashing.
///
/// Must match the Babel extractor's key format from processProps.ts:
/// `(queryString || '') + (ampersandString || '') + (mediaQuery ? mediaQuery + '~' : '') + key + ':' + styleValue`
///
/// Where `key` = `propName + keySuffix` and `keySuffix` = queryString + pseudoelement + pseudoclass + ampersandString
///
/// Simplified (no ampersandString or runtime mediaQuery for now):
/// `queryString + propName + keySuffix + ':' + styleValue`
pub fn build_style_key(
    prop_name: &str,
    css_value: &str,
    pseudo_class: Option<&str>,
    pseudo_element: Option<&str>,
    query_string: Option<&str>,
    ampersand_string: Option<&str>,
) -> String {
    // Estimate capacity to avoid reallocations.
    // Layout: (qs)(amp)(propName)(qs)(::pe)(:pc)(amp)(:)(cssValue)
    let qs_len = query_string.map_or(0, |s| s.len());
    let amp_len = ampersand_string.map_or(0, |s| s.len());
    let pe_len = pseudo_element.map_or(0, |s| s.len() + 2);
    let pc_len = pseudo_class.map_or(0, |s| s.len() + 1);
    let cap = qs_len
        + amp_len
        + prop_name.len()
        + qs_len
        + pe_len
        + pc_len
        + amp_len
        + 1
        + css_value.len();
    let mut result = String::with_capacity(cap);

    // Prefix: (queryString || '') + (ampersandString || '')
    if let Some(qs) = query_string {
        result.push_str(qs);
    }
    if let Some(amp) = ampersand_string {
        result.push_str(amp);
    }

    // prop_key = propName + keySuffix (inlined)
    result.push_str(prop_name);

    // keySuffix: (queryString || '') + (::pseudoelement) + (:pseudoclass) + (ampersandString || '')
    if let Some(qs) = query_string {
        result.push_str(qs);
    }
    if let Some(pe) = pseudo_element {
        result.push_str("::");
        result.push_str(pe);
    }
    if let Some(pc) = pseudo_class {
        result.push(':');
        result.push_str(pc);
    }
    if let Some(amp) = ampersand_string {
        result.push_str(amp);
    }

    // Separator + value
    result.push(':');
    result.push_str(css_value);

    result
}

/// Generate a CSS rule string (simple version, no pseudo/media/specificity).
///
/// Delegates to `generate_css_rule_full` with defaults.
pub fn generate_css_rule(class_name: &str, property: &str, value: &str) -> String {
    generate_css_rule_full(class_name, property, value, 0, None, None, None, None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_string_hash_basic() {
        // Verify the hash is deterministic
        let hash1 = string_hash("color:red");
        let hash2 = string_hash("color:red");
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_string_hash_different_inputs() {
        let hash1 = string_hash("color:red");
        let hash2 = string_hash("color:blue");
        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_radix_36_zero() {
        assert_eq!(radix_36(0), "0");
    }

    #[test]
    fn test_radix_36_small() {
        assert_eq!(radix_36(1), "1");
        assert_eq!(radix_36(10), "a");
        assert_eq!(radix_36(35), "z");
        assert_eq!(radix_36(36), "10");
    }

    #[test]
    fn test_get_class_name_format() {
        let class_name = get_class_name("color:red");
        assert!(class_name.starts_with('_'));
        assert!(class_name.len() <= 8); // _ + max 7 chars for base36 of u32
    }

    #[test]
    fn test_generate_css_rule() {
        let rule = generate_css_rule("_abc", "color", "red");
        assert_eq!(rule, "._abc{color:red}");
    }

    #[test]
    fn test_generate_css_rule_camel_case() {
        let rule = generate_css_rule("_abc", "fontSize", "16px");
        assert_eq!(rule, "._abc{font-size:16px}");
    }

    #[test]
    fn test_hash_parity_with_js() {
        let hash = string_hash("color:red");
        assert!(hash > 0);
        let b36 = radix_36(hash);
        assert!(b36.len() <= 7);
    }

    // --- parse_prop_name tests ---

    #[test]
    fn test_parse_simple_prop() {
        let parsed = parse_prop_name("color");
        assert_eq!(parsed.css_prop_name, "color");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_hover_color() {
        let parsed = parse_prop_name("hoverColor");
        assert_eq!(parsed.css_prop_name, "color");
        assert_eq!(parsed.pseudo_class, Some("hover"));
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_active_opacity() {
        let parsed = parse_prop_name("activeOpacity");
        assert_eq!(parsed.css_prop_name, "opacity");
        assert_eq!(parsed.pseudo_class, Some("active"));
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_placeholder_color() {
        let parsed = parse_prop_name("placeholderColor");
        assert_eq!(parsed.css_prop_name, "color");
        assert!(parsed.pseudo_class.is_none());
        assert_eq!(parsed.pseudo_element, Some("placeholder"));
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_before_content() {
        let parsed = parse_prop_name("beforeContent");
        assert_eq!(parsed.css_prop_name, "content");
        assert!(parsed.pseudo_class.is_none());
        assert_eq!(parsed.pseudo_element, Some("before"));
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_pseudoelement_then_pseudoclass() {
        // placeholderHoverColor -> ::placeholder + :hover + color
        let parsed = parse_prop_name("placeholderHoverColor");
        assert_eq!(parsed.css_prop_name, "color");
        assert_eq!(parsed.pseudo_class, Some("hover"));
        assert_eq!(parsed.pseudo_element, Some("placeholder"));
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_margin_left_specificity() {
        let parsed = parse_prop_name("marginLeft");
        assert_eq!(parsed.css_prop_name, "marginLeft");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 1);
    }

    #[test]
    fn test_parse_padding_top_specificity() {
        let parsed = parse_prop_name("paddingTop");
        assert_eq!(parsed.css_prop_name, "paddingTop");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 1);
    }

    #[test]
    fn test_parse_font_size_specificity() {
        let parsed = parse_prop_name("fontSize");
        assert_eq!(parsed.css_prop_name, "fontSize");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 1);
    }

    #[test]
    fn test_parse_background_color_specificity() {
        let parsed = parse_prop_name("backgroundColor");
        assert_eq!(parsed.css_prop_name, "backgroundColor");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 1);
    }

    #[test]
    fn test_parse_no_specificity_for_plain_color() {
        let parsed = parse_prop_name("color");
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_display() {
        let parsed = parse_prop_name("display");
        assert_eq!(parsed.css_prop_name, "display");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_hover_margin_left() {
        // hoverMarginLeft -> :hover + marginLeft, specificity = 1 (margin prefix)
        let parsed = parse_prop_name("hoverMarginLeft");
        assert_eq!(parsed.css_prop_name, "marginLeft");
        assert_eq!(parsed.pseudo_class, Some("hover"));
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 1);
    }

    #[test]
    fn test_shorthand_expansion() {
        assert_eq!(
            expand_shorthand("marginH"),
            Some(["marginLeft", "marginRight"].as_slice())
        );
        assert_eq!(
            expand_shorthand("marginV"),
            Some(["marginTop", "marginBottom"].as_slice())
        );
        assert_eq!(
            expand_shorthand("paddingH"),
            Some(["paddingLeft", "paddingRight"].as_slice())
        );
        assert_eq!(
            expand_shorthand("paddingV"),
            Some(["paddingTop", "paddingBottom"].as_slice())
        );
        assert_eq!(expand_shorthand("color"), None);
    }

    #[test]
    fn test_generate_css_rule_full_basic() {
        let rule = generate_css_rule_full("_abc", "color", "red", 0, None, None, None, None);
        assert_eq!(rule, "._abc{color:red}");
    }

    #[test]
    fn test_generate_css_rule_full_pseudo_class() {
        let rule =
            generate_css_rule_full("_abc", "color", "blue", 0, Some("hover"), None, None, None);
        assert_eq!(rule, "._abc:hover{color:blue}");
    }

    #[test]
    fn test_generate_css_rule_full_pseudo_element() {
        let rule = generate_css_rule_full(
            "_abc",
            "color",
            "gray",
            0,
            None,
            Some("placeholder"),
            None,
            None,
        );
        assert_eq!(rule, "._abc::placeholder{color:gray}");
    }

    #[test]
    fn test_generate_css_rule_full_specificity() {
        let rule = generate_css_rule_full("_abc", "margin-left", "10px", 1, None, None, None, None);
        assert_eq!(rule, "._abc._abc{margin-left:10px}");
    }

    #[test]
    fn test_generate_css_rule_full_media_query() {
        let rule = generate_css_rule_full(
            "_abc",
            "color",
            "red",
            2,
            None,
            None,
            Some("@media (min-width: 800px)"),
            None,
        );
        assert_eq!(
            rule,
            "@media (min-width: 800px){._abc._abc._abc{color:red}}"
        );
    }

    #[test]
    fn test_generate_css_rule_full_all_features() {
        let rule = generate_css_rule_full(
            "_abc",
            "color",
            "blue",
            2,
            Some("hover"),
            Some("placeholder"),
            Some("@media (min-width: 800px)"),
            None,
        );
        assert_eq!(
            rule,
            "@media (min-width: 800px){._abc._abc._abc:hover::placeholder{color:blue}}"
        );
    }

    #[test]
    fn test_generate_css_rule_full_ampersand() {
        let rule = generate_css_rule_full(
            "_abc",
            "color",
            "blue",
            0,
            None,
            None,
            None,
            Some("& > span"),
        );
        assert_eq!(rule, "._abc > span{color:blue}");
    }

    #[test]
    fn test_generate_css_rule_full_ampersand_with_media() {
        let rule = generate_css_rule_full(
            "_abc",
            "color",
            "blue",
            2,
            None,
            None,
            Some("@media (min-width: 800px)"),
            Some("& > span"),
        );
        assert_eq!(
            rule,
            "@media (min-width: 800px){._abc._abc._abc > span{color:blue}}"
        );
    }

    #[test]
    fn test_build_style_key_basic() {
        let key = build_style_key("color", "red", None, None, None, None);
        assert_eq!(key, "color:red");
    }

    #[test]
    fn test_build_style_key_with_pseudo() {
        let key = build_style_key("color", "blue", Some("hover"), None, None, None);
        assert_eq!(key, "color:hover:blue");
    }

    #[test]
    fn test_build_style_key_with_pseudo_element() {
        let key = build_style_key("color", "gray", None, Some("placeholder"), None, None);
        assert_eq!(key, "color::placeholder:gray");
    }

    #[test]
    fn test_build_style_key_with_ampersand() {
        let key = build_style_key("color", "blue", None, None, None, Some("& > span"));
        assert_eq!(key, "& > spancolor& > span:blue");
    }

    #[test]
    fn test_build_style_key_with_ampersand_and_media() {
        let key = build_style_key(
            "color",
            "blue",
            None,
            None,
            Some("@media (min-width: 800px)"),
            Some("& > span"),
        );
        assert_eq!(
            key,
            "@media (min-width: 800px)& > spancolor@media (min-width: 800px)& > span:blue"
        );
    }

    // --- string_hash JS parity tests ---

    #[test]
    fn test_string_hash_js_parity() {
        // Known values from the JS stringHash implementation:
        // stringHash("color:red") => 3378308849
        // stringHash("font-size:16px") => 3863686795
        // stringHash("display:block") => 763215660
        // stringHash("") => 5381
        assert_eq!(string_hash("color:red"), 3378308849);
        assert_eq!(string_hash("font-size:16px"), 3863686795);
        assert_eq!(string_hash("display:block"), 763215660);
        assert_eq!(string_hash(""), 5381);
    }

    #[test]
    fn test_radix_36_js_parity() {
        // Known values from JS: (hash).toString(36)
        assert_eq!(radix_36(3378308849), "1jvcvsh");
        assert_eq!(radix_36(3863686795), "1rwc7t7");
        assert_eq!(radix_36(763215660), "cmecz0");
        assert_eq!(radix_36(5381), "45h");
    }

    #[test]
    fn test_get_class_name_js_parity() {
        // get_class_name("color:red") should produce "_" + radix_36(string_hash("color:red"))
        assert_eq!(get_class_name("color:red"), "_1jvcvsh");
        assert_eq!(get_class_name("font-size:16px"), "_1rwc7t7");
        assert_eq!(get_class_name("display:block"), "_cmecz0");
    }

    // --- parse_prop_name edge cases ---

    #[test]
    fn test_parse_bare_pseudoclass_name() {
        // "active" is all-lowercase, so capRegex.test() finds no uppercase letter.
        // It should be treated as a plain CSS property name, NOT as a pseudoclass.
        let parsed = parse_prop_name("active");
        assert_eq!(parsed.css_prop_name, "active");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
        assert_eq!(parsed.specificity, 0);
    }

    #[test]
    fn test_parse_bare_pseudoelement_name() {
        // "placeholder" is all-lowercase -> treated as plain prop name
        let parsed = parse_prop_name("placeholder");
        assert_eq!(parsed.css_prop_name, "placeholder");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
    }

    #[test]
    fn test_parse_single_char_prop() {
        let parsed = parse_prop_name("x");
        assert_eq!(parsed.css_prop_name, "x");
        assert!(parsed.pseudo_class.is_none());
        assert!(parsed.pseudo_element.is_none());
    }
}
