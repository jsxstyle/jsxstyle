'use strict'

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');
var autoprefix = require('./autoprefix');

function createCSS(styles, className, comment, pseudoSelector) {
  if (!styles) {
    return null;
  }
  pseudoSelector = pseudoSelector || '';
  if (comment) {
    // pretty print if comment
    return (
      '\n.' + className + pseudoSelector + ' {\n' +
      comment +
      CSSPropertyOperations.createMarkupForStyles(
        autoprefix(styles)
      ).split(';').join(';\n  ').trim() +
      '\n}\n\n'
    );
  }
  else {
    // almost-minify
    return (
      '\n.' + className + pseudoSelector + ' {\n' +
      CSSPropertyOperations.createMarkupForStyles(autoprefix(styles)) +
      '\n}\n'
    );
  }
}

module.exports = createCSS;
