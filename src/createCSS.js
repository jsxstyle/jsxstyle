'use strict';

const createMarkupForStyles = require('./createMarkupForStyles');

function createCSS(styleObject, className, pseudoSelector) {
  if (!styleObject) {
    return '';
  }

  const cssMarkup = createMarkupForStyles(styleObject);

  if (!cssMarkup) {
    return '';
  }

  return `.${className}${pseudoSelector || ''} {${cssMarkup}}\n`;
}

module.exports = createCSS;
