'use strict';

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
const hyphenateCache = {};

function hyphenateStyleName(string) {
  if (hyphenateCache.hasOwnProperty(string)) {
    return hyphenateCache[string];
  }
  const hyphenatedString = string
    .replace(uppercasePattern, '-$1')
    .toLowerCase()
    .replace(msPattern, '-ms-');

  hyphenateCache[string] = hyphenatedString;
  return hyphenateCache[string];
}

module.exports = hyphenateStyleName;
