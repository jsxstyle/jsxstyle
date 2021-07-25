import { CSSProperties, getStyleKeysForProps } from 'jsxstyle-utils';

export function getClassNameFromCache(
  styleObject: CSSProperties,
  classNamePropKey: string,
  getClassNameForKey: (key: string) => string
): string | null {
  const classNameKey = getStyleKeysForProps(styleObject, classNamePropKey)
    ?.classNameKey;

  if (!classNameKey) {
    return null;
  }

  return getClassNameForKey(classNameKey);
}
