'use strict';

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;

function hyphenateStyleName(string) {
  return string.replace(uppercasePattern, '-$1').toLowerCase().replace(msPattern, '-ms-');
}

module.exports = hyphenateStyleName;
