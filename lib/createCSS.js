'use strict'

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');
var autoprefix = require('./autoprefix');

function createCSS(styles, className, comment, pseudoSelector) {
  if (!styles) {
    return null;
  }
  pseudoSelector = pseudoSelector || '';
  comment = comment || '';
  return (
    '.' + className + pseudoSelector + ' {\n' +
    '  ' + comment +
    CSSPropertyOperations.createMarkupForStyles(
      autoprefix(styles)
    ).split(';').join(';\n  ').trim() +
    '\n}\n\n'
  );
}

module.exports = createCSS;
