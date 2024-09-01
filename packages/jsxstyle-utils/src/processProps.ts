import { dangerousStyleValue } from './dangerousStyleValue';
import { hyphenateStyleName } from './hyphenateStyleName';
import { parseStyleProps } from './parseStyleProps';

export type GetClassNameForKeyFn = (key: string) => string;

export type InsertRuleCallback = (rule: string, key: string) => void;

export function processProps(
  props: Record<string, any>,
  classNamePropKey: string,
  getClassNameForKey: GetClassNameForKeyFn,
  insertRuleCallback?: InsertRuleCallback,
  mediaQuery?: string
): Record<string, unknown> | null {
  if (props == null || typeof props !== 'object') {
    return null;
  }

  const { parsedStyleProps, componentProps } = parseStyleProps(props);

  let classNames: string = props.class || props.className || '';

  propLoop: for (const key in parsedStyleProps) {
    const mergedProp = parsedStyleProps[key];
    const {
      pseudoelement,
      pseudoclass,
      propName,
      propValue,
      ampersandString,
      queryString,
    } = mergedProp;

    let specificity = mergedProp.specificity;
    let styleValue: string;
    let className: string;
    let hyphenatedPropName: string;

    if (mediaQuery || queryString) {
      specificity += 2;
    }

    if (
      propName === 'animation' &&
      propValue &&
      typeof propValue === 'object'
    ) {
      let animationValue = '';
      for (const k in propValue) {
        const obj = propValue[k];
        let groupStyles = '';

        const animationResult = parseStyleProps(obj);

        for (const key in animationResult.parsedStyleProps) {
          const { propName, propValue, pseudoclass, pseudoelement } =
            animationResult.parsedStyleProps[key];
          if (pseudoclass || pseudoelement) {
            if (
              typeof process !== 'undefined' &&
              process.env.NODE_ENV !== 'production'
            ) {
              console.error(
                '[jsxstyle] Encountered a pseudo-prefixed prop in animation value: %s%s%s',
                propName,
                pseudoelement ? '::' + pseudoelement : '',
                pseudoclass ? ':' + pseudoclass : ''
              );
            }
            continue propLoop;
          }
          const value = dangerousStyleValue(propName, propValue);
          if (value === '') continue;
          groupStyles +=
            (groupStyles === '' ? ' ' : '; ') +
            hyphenateStyleName(propName) +
            ':' +
            value;
        }

        if (groupStyles === '') {
          if (
            typeof process !== 'undefined' &&
            process.env.NODE_ENV !== 'production'
          ) {
            console.error(
              '[jsxstyle] Animation value `%s` contained no valid style props:',
              k,
              obj
            );
          }

          continue propLoop;
        }

        animationValue += k + ' {' + groupStyles + ' } ';
      }

      if (animationValue === '') {
        // biome-ignore lint/complexity/noUselessLabel: explicit continue
        continue propLoop;
      }

      const animationKey = getClassNameForKey(animationValue);

      className = animationKey;
      hyphenatedPropName = 'animation-name';
      styleValue = animationKey;
      specificity++;

      insertRuleCallback?.(
        `@keyframes ${animationKey} { ${animationValue}}`,
        '@' + animationKey
      );
    } else {
      styleValue = dangerousStyleValue(propName, propValue);
      if (styleValue === '') continue;

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
      ((queryString ? queryString + ' { ' : '') ||
        (mediaQuery ? '@media ' + mediaQuery + ' { ' : '') ||
        '') +
      selector +
      ' { ' +
      hyphenatedPropName +
      ':' +
      styleValue +
      ' }' +
      (queryString || mediaQuery ? ' }' : '');

    classNames += (classNames === '' ? '' : ' ') + className;

    insertRuleCallback?.(styleRule, className);
  }

  if (classNames) {
    componentProps[classNamePropKey] = classNames;
  }

  return componentProps;
}
