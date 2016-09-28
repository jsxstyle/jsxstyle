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

  return (
    '.' + className + pseudoSelector + ' {\n' +
    '  ' + comment + cssMarkup + '\n}\n\n'
  );
}

createCSS.injection = {
  autoprefix: styles => styles,
};

module.exports = createCSS;
