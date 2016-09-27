'use strict'

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');

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
      createCSS.injection.autoprefix(styles)
    ).split(';').join(';\n  ').trim() +
    '\n}\n\n'
  );
}

createCSS.injection = {
  autoprefix: styles => styles,
};

module.exports = createCSS;
