'use strict';

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
const cache = {};

function hyphenateStyleName(string) {
  if (cache.hasOwnProperty(string)) {
    return string;
  }
  cache[string] = string
    .replace(uppercasePattern, '-$1')
    .toLowerCase()
    .replace(msPattern, '-ms-');
  return cache[string];
}

module.exports = hyphenateStyleName;
