const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
const hyphenateCache: Record<string, string> = {};

export function hyphenateStyleName(styleName: string): string {
  if (!hyphenateCache.hasOwnProperty(styleName)) {
    const hyphenatedString = styleName
      .replace(uppercasePattern, '-$1')
      .toLowerCase()
      .replace(msPattern, '-ms-');

    hyphenateCache[styleName] = hyphenatedString;
  }
  // biome-ignore lint/style/noNonNullAssertion: value is set above
  return hyphenateCache[styleName]!;
}
