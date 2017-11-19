const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
const hyphenateCache = {};

export default function hyphenateStyleName(styleName: string): string {
  if (hyphenateCache.hasOwnProperty(styleName)) {
    return hyphenateCache[styleName];
  }
  const hyphenatedString = styleName
    .replace(uppercasePattern, '-$1')
    .toLowerCase()
    .replace(msPattern, '-ms-');

  hyphenateCache[styleName] = hyphenatedString;
  return hyphenateCache[styleName];
}
