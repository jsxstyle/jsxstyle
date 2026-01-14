import { parseStyleProp, shorthandProps } from './parseStyleProp.js';
import {
  type GetClassNameForKeyFn,
  type InsertRuleCallback,
  processProps,
} from './processProps.js';

const expandShorthandProps = (
  styleProps: Record<string, unknown>
): Record<string, unknown> => {
  const expandedProps: Record<string, unknown> = {};
  for (const key in styleProps) {
    const propFn = shorthandProps[key as keyof typeof shorthandProps];
    if (typeof propFn !== 'function') {
      expandedProps[key] = styleProps[key];
      continue;
    }
    const nestedStyleProps = propFn(styleProps[key] as any);
    for (const propName in nestedStyleProps) {
      expandedProps[propName] =
        nestedStyleProps[propName as keyof typeof nestedStyleProps];
    }
  }
  return expandedProps;
};

export interface ProcessedMakeComponentStyleProps {
  styleRules: string[];
  classNamesByPropName: Record<string, string>;
}

/**
 * A lightweight version of `parseStyleProps` that only supports style props.
 * Media/container queries, pseudoclasses/pseudoelements, and nested styles are
 * not supported.
 */
export function processMakeComponentStyleProps(
  styleProps: Record<string, any>,
  getClassNameForKey: GetClassNameForKeyFn,
  onInsertRule: InsertRuleCallback
): Record<string, string> {
  const expandedProps = expandShorthandProps(styleProps);
  const classNamesByPropName: Record<string, string> = {};
  for (const propName in expandedProps) {
    const parsedResult = parseStyleProp(propName, expandedProps[propName]);
    if (!parsedResult || parsedResult.type !== 'styleProp') continue;
    const className = processProps(
      parsedResult.parsedStyleProps,
      null,
      getClassNameForKey,
      onInsertRule
    );
    if (className) {
      classNamesByPropName[propName] = className;
    }
  }
  return classNamesByPropName;
}
