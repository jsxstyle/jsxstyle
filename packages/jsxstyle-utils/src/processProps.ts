import { dangerousStyleValue } from './dangerousStyleValue';
import { hyphenateStyleName } from './hyphenateStyleName';
import { parseStyleProps } from './parseStyleProps';

interface PropsAndRules {
  /** Filtered props object */
  props: Record<string, any>;
  /** An array of CSS rules extracted from style props */
  rules: string[];
}

export function processProps(
  props: Record<string, any>,
  classNamePropKey: string,
  getClassNameForKey: (key: string) => string,
  mediaQuery?: string
): PropsAndRules {
  const rules: string[] = [];

  if (props == null || typeof props !== 'object') {
    return {
      props: {},
      rules,
    };
  }

  const { parsedStyleProps, componentProps } = parseStyleProps(
    props,
    classNamePropKey
  );

  if (!parsedStyleProps) {
    return {
      props: componentProps,
      rules,
    };
  }

  let classNames: string = props[classNamePropKey] || '';

  propLoop: for (const key in parsedStyleProps) {
    const mergedProp = parsedStyleProps[key];
    const { pseudoelement, pseudoclass, propName, propValue } = mergedProp;

    let specificity = mergedProp.specificity;
    let styleValue: any;
    let className: string;
    let hyphenatedPropName: string;

    if (mediaQuery) {
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

        const animationResult = parseStyleProps(obj, 'className');

        for (const key in animationResult.parsedStyleProps) {
          const {
            propName,
            propValue,
            pseudoclass,
            pseudoelement,
          } = animationResult.parsedStyleProps[key];
          if (pseudoclass || pseudoelement) {
            if (process.env.NODE_ENV !== 'production') {
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
          if (process.env.NODE_ENV !== 'production') {
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
        continue propLoop;
      }

      const animationKey = getClassNameForKey(animationValue);

      className = animationKey;
      hyphenatedPropName = 'animation-name';
      styleValue = animationKey;
      specificity++;

      rules.push(`@keyframes ${animationKey} { ${animationValue}}`);
    } else {
      styleValue = dangerousStyleValue(propName, propValue);
      if (styleValue === '') continue;

      className = getClassNameForKey(
        (mediaQuery ? mediaQuery + '~' : '') + key + ':' + styleValue
      );
      hyphenatedPropName = hyphenateStyleName(propName);
    }

    const styleRule =
      (mediaQuery ? '@media ' + mediaQuery + ' { ' : '') +
      '.' +
      className +
      (specificity > 0 ? '.' + className : '') +
      (specificity > 1 ? '.' + className : '') +
      (specificity > 2 ? '.' + className : '') +
      (specificity > 3 ? '.' + className : '') +
      (pseudoclass ? ':' + pseudoclass : '') +
      (pseudoelement ? '::' + pseudoelement : '') +
      ' { ' +
      hyphenatedPropName +
      ':' +
      styleValue +
      ' }' +
      (mediaQuery ? ' }' : '');

    classNames += (classNames === '' ? '' : ' ') + className;

    rules.push(styleRule);
  }

  if (classNames) {
    componentProps[classNamePropKey] = classNames;
  }

  return { props: componentProps, rules };
}
