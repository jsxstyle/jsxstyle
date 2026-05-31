use crate::generated_constants::UNITLESS_NUMBERS;
use crate::types::StaticValue;

/// Check if a CSS property accepts unitless numbers.
fn is_unitless(name: &str) -> bool {
    UNITLESS_NUMBERS.binary_search(&name).is_ok()
}

/// Format a static value for use in a CSS rule.
///
/// Returns `None` for values that should not produce CSS output
/// (null, undefined, boolean, empty string).
///
/// Must match `@jsxstyle/core/src/dangerousStyleValue.ts` exactly.
pub fn dangerous_style_value(name: &str, value: &StaticValue) -> Option<String> {
    match value {
        StaticValue::Null
        | StaticValue::Undefined
        | StaticValue::Bool(_)
        | StaticValue::Object(_) => None,
        StaticValue::String(s) => {
            if s.is_empty() {
                None
            } else {
                Some(s.trim().to_string())
            }
        }
        StaticValue::Number(n) => {
            let n = *n;
            if n == 0.0 {
                Some("0".to_string())
            } else if n > -1.0 && n < 1.0 {
                // Fractional values between -1 and 1 (exclusive) -> percentage
                // CRITICAL: must match JS exactly: Math.round(value * 1e6) / 1e4 + "%"
                let pct = (n * 1_000_000.0).round() / 10_000.0;
                // Format without trailing zeros for clean output
                if pct.fract() == 0.0 {
                    let pct_int = pct as i64;
                    Some(format!("{pct_int}%"))
                } else {
                    Some(format!("{pct}%"))
                }
            } else if is_unitless(name) {
                // Unitless number: output as-is
                if n.fract() == 0.0 {
                    let n_int = n as i64;
                    Some(format!("{n_int}"))
                } else {
                    Some(format!("{n}"))
                }
            } else {
                // Append px unit
                if n.fract() == 0.0 {
                    let n_int = n as i64;
                    Some(format!("{n_int}px"))
                } else {
                    Some(format!("{n}px"))
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_null_undefined_bool() {
        assert_eq!(dangerous_style_value("color", &StaticValue::Null), None);
        assert_eq!(
            dangerous_style_value("color", &StaticValue::Undefined),
            None
        );
        assert_eq!(
            dangerous_style_value("color", &StaticValue::Bool(true)),
            None
        );
    }

    #[test]
    fn test_empty_string() {
        assert_eq!(
            dangerous_style_value("color", &StaticValue::String(String::new())),
            None
        );
    }

    #[test]
    fn test_string_value() {
        assert_eq!(
            dangerous_style_value("color", &StaticValue::String("red".to_string())),
            Some("red".to_string())
        );
    }

    #[test]
    fn test_string_trimmed() {
        assert_eq!(
            dangerous_style_value("color", &StaticValue::String("  red  ".to_string())),
            Some("red".to_string())
        );
    }

    #[test]
    fn test_zero() {
        assert_eq!(
            dangerous_style_value("width", &StaticValue::Number(0.0)),
            Some("0".to_string())
        );
    }

    #[test]
    fn test_pixel_value() {
        assert_eq!(
            dangerous_style_value("width", &StaticValue::Number(100.0)),
            Some("100px".to_string())
        );
        assert_eq!(
            dangerous_style_value("fontSize", &StaticValue::Number(16.0)),
            Some("16px".to_string())
        );
    }

    #[test]
    fn test_fractional_percentage() {
        assert_eq!(
            dangerous_style_value("opacity", &StaticValue::Number(0.5)),
            Some("50%".to_string())
        );
    }

    #[test]
    fn test_unitless_number() {
        assert_eq!(
            dangerous_style_value("fontWeight", &StaticValue::Number(700.0)),
            Some("700".to_string())
        );
        assert_eq!(
            dangerous_style_value("zIndex", &StaticValue::Number(10.0)),
            Some("10".to_string())
        );
        assert_eq!(
            dangerous_style_value("lineHeight", &StaticValue::Number(1.5)),
            Some("1.5".to_string())
        );
    }
}
