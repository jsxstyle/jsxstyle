import { dangerousStyleValue } from './dangerousStyleValue.js';
import { hyphenateStyleName } from './hyphenateStyleName.js';
import type { ParsedStyleProp } from './parseStyleProp.js';
import { parseStyleProps } from './parseStyleProps.js';
import type {
  GetClassNameForKeyFn,
  InsertRuleCallback,
} from './processProps.js';

export const processProp = (
  key: string,
  parsedProp: ParsedStyleProp,
  mediaQuery: string | undefined,
  getClassNameForKey: GetClassNameForKeyFn,
  insertRuleCallback?: InsertRuleCallback
): string | null => {
  const {
    pseudoelement,
    pseudoclass,
    propName,
    propValue,
    ampersandString,
    queryString,
  } = parsedProp;

  let specificity = parsedProp.specificity;
  let styleValue: string;
  let className: string;
  let hyphenatedPropName: string;

  if (mediaQuery || queryString) {
    specificity += 2;
  }

  if (propName === 'animation' && propValue && typeof propValue === 'object') {
    let animationValue = '';
    for (const k in propValue) {
      const obj = propValue[k];
      let groupStyles = '';

      const animationResult = parseStyleProps(obj);

      for (const key in animationResult.parsedStyleProps) {
        const { propName, propValue, pseudoclass, pseudoelement } =
          // biome-ignore lint/style/noNonNullAssertion: we know key is in parsedStyleProps
          animationResult.parsedStyleProps[key]!;
        if (pseudoclass || pseudoelement) {
          if (
            // @ts-expect-error
            typeof process !== 'undefined' &&
            // @ts-expect-error
            process.env.NODE_ENV !== 'production'
          ) {
            console.error(
              '[jsxstyle] Encountered a pseudo-prefixed prop in animation value: %s%s%s',
              propName,
              pseudoelement ? '::' + pseudoelement : '',
              pseudoclass ? ':' + pseudoclass : ''
            );
          }
          return null;
        }
        const value = dangerousStyleValue(propName, propValue);
        if (value === '') continue;
        groupStyles +=
          (groupStyles === '' ? '' : ';') +
          hyphenateStyleName(propName) +
          ':' +
          value;
      }

      if (groupStyles === '') {
        if (
          // @ts-expect-error
          typeof process !== 'undefined' &&
          // @ts-expect-error
          process.env.NODE_ENV !== 'production'
        ) {
          console.error(
            '[jsxstyle] Animation value `%s` contained no valid style props:',
            k,
            obj
          );
        }

        return null;
      }

      animationValue += k + '{' + groupStyles + '}';
    }

    if (animationValue === '') {
      return null;
    }

    const animationKey = getClassNameForKey(animationValue);

    className = animationKey;
    hyphenatedPropName = 'animation-name';
    styleValue = animationKey;
    specificity++;

    insertRuleCallback?.(
      `@keyframes ${animationKey}{${animationValue}}`,
      '@' + animationKey
    );
  } else {
    styleValue = dangerousStyleValue(propName, propValue);
    if (styleValue === '') return null;

    className = getClassNameForKey(
      (queryString || '') +
        (ampersandString || '') +
        (mediaQuery ? mediaQuery + '~' : '') +
        key +
        ':' +
        styleValue
    );
    hyphenatedPropName = hyphenateStyleName(propName);
  }

  const classNameSelector =
    '.' +
    className +
    (specificity > 0 ? '.' + className : '') +
    (specificity > 1 ? '.' + className : '') +
    (specificity > 2 ? '.' + className : '') +
    (specificity > 3 ? '.' + className : '') +
    (pseudoclass ? ':' + pseudoclass : '') +
    (pseudoelement ? '::' + pseudoelement : '');

  const selector =
    ampersandString?.replace(/&/g, classNameSelector) || classNameSelector;

  const styleRule =
    ((queryString ? queryString + '{' : '') ||
      (mediaQuery ? '@media ' + mediaQuery + '{' : '') ||
      '') +
    selector +
    '{' +
    hyphenatedPropName +
    ':' +
    styleValue +
    '}' +
    (queryString || mediaQuery ? '}' : '');

  insertRuleCallback?.(styleRule, className);
  return className;
};
