'use strict';

const CSSPropertyOperations = require('react-css-property-operations');

function createCSS(styles, className, comment, pseudoSelector) {
  if (!styles) {
    return null;
  }

  const autoprefixedStyles = createCSS.injection.autoprefix(styles);
  const cssMarkup = CSSPropertyOperations.createMarkupForStyles(autoprefixedStyles);

  if (!cssMarkup) {
    return null;
  }

  return `.${className}${pseudoSelector || ''} {
  ${comment || ''}${cssMarkup}
}`;
}

createCSS.injection = {
  autoprefix: styles => styles,
};

module.exports = createCSS;
