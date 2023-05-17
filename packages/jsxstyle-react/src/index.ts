import {
  componentStyles,
  type DeprecatedJsxstyleComponentName,
} from '../../jsxstyle-utils/src';
import { styleCache } from './styleCache';
import { createElement } from 'react';
import { componentFactory, classNamePropKey } from './componentFactory';
import { makeCssFunction } from '../../jsxstyle-utils/src/makeCssFunction';

export type { CSSProperties } from '../../jsxstyle-utils/src';
export type { StylableComponentProps } from './types';
export { styleCache as cache };
export { useMatchMedia } from './useMatchMedia';
export { makeCustomProperties } from '../../jsxstyle-utils/src';

export const css = makeCssFunction(
  classNamePropKey,
  styleCache.getComponentProps
);

let depFactory: any = componentFactory;

if (process.env.NODE_ENV !== 'production') {
  depFactory = function (displayName: DeprecatedJsxstyleComponentName) {
    const defaultProps = componentStyles[displayName];
    let hasWarned = false;

    const component = (props: Record<string, any>) => {
      if (!hasWarned) {
        hasWarned = true;
        console.error(
          'jsxstyle\u2019s `%s` component is deprecated and will be removed in future versions of jsxstyle.',
          displayName
        );
      }
      return createElement(Box as any, props);
    };

    component.displayName = displayName;
    component.defaultProps = defaultProps;

    return component;
  };
}

// Using ReturnType + explicit typing to prevent Hella Dupes in the generated types
type JsxstyleComponent = ReturnType<typeof componentFactory>;

export const Box: JsxstyleComponent = componentFactory('Box');
export const Block: JsxstyleComponent = componentFactory('Block');
export const Inline: JsxstyleComponent = componentFactory('Inline');
export const InlineBlock: JsxstyleComponent = componentFactory('InlineBlock');

export const Row: JsxstyleComponent = componentFactory('Row');
export const Col: JsxstyleComponent = componentFactory('Col');
export const InlineRow: JsxstyleComponent = componentFactory('InlineRow');
export const InlineCol: JsxstyleComponent = componentFactory('InlineCol');

export const Grid: JsxstyleComponent = componentFactory('Grid');

// <Box component="table" />
export const Table: JsxstyleComponent = depFactory('Table');
export const TableRow: JsxstyleComponent = depFactory('TableRow');
export const TableCell: JsxstyleComponent = depFactory('TableCell');
// <Row display="inline-flex" />
export const Flex: JsxstyleComponent = depFactory('Flex');
export const InlineFlex: JsxstyleComponent = depFactory('InlineFlex');
