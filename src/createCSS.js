'use strict'

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');

function createCSS(styles, className, comment, pseudoSelector) {
  if (!styles) {
    return null;
  }
  var cssMarkup = CSSPropertyOperations.createMarkupForStyles(
    createCSS.injection.autoprefix(styles)
  );

  if (!cssMarkup) {
    return null;
  }

  pseudoSelector = pseudoSelector || '';
  comment = comment || '';

  // TODO: remove split()/join()/trim() for performance reasons
  return (
    '.' + className + pseudoSelector + ' {\n' +
    '  ' + comment +
    cssMarkup.split(';').join(';\n  ').trim() +
    '\n}\n\n'
  );
}

createCSS.injection = {
  autoprefix: styles => styles,
};

module.exports = createCSS;
