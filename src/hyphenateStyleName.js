'use strict';

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
const hyphenateCache = {};

const invariant = require('invariant');

function hyphenateStyleName(string) {
  invariant(
    typeof string === 'string',
    'hyphenateStyleName received a non-string thing: %s',
    string
  );
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
