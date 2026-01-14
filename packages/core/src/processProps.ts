import type { ParsedStyleProp } from './parseStyleProp.js';
import { processProp } from './processProp.js';

export type GetClassNameForKeyFn = (key: string) => string;

export type InsertRuleCallback = (rule: string, key: string) => void;

export function processProps(
  parsedStyleProps: Record<string, ParsedStyleProp>,
  componentProps: Record<string, unknown> | null,
  getClassNameForKey: GetClassNameForKeyFn,
  insertRuleCallback?: InsertRuleCallback,
  mediaQuery?: string
): string | null {
  let classNames: string =
    typeof componentProps?.class === 'string'
      ? componentProps.class
      : typeof componentProps?.className === 'string'
        ? componentProps.className
        : '';

  for (const key in parsedStyleProps) {
    // biome-ignore lint/style/noNonNullAssertion: we know key is in parsedStyleProps
    const mergedProp = parsedStyleProps[key]!;
    const className = processProp(
      key,
      mergedProp,
      mediaQuery,
      getClassNameForKey,
      insertRuleCallback
    );
    if (className) {
      classNames += (classNames === '' ? '' : ' ') + className;
    }
  }

  return classNames || null;
}
