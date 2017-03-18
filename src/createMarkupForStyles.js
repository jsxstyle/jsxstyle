'use strict';

const dangerousStyleValue = require('./dangerousStyleValue');
const hyphenateStyleName = require('./hyphenateStyleName');

// Extracted from react-dom/lib/createMarkupForStyles
function createMarkupForStyles(styleObj) {
  let serialized = '';
  for (const styleName in styleObj) {
    if (!styleObj.hasOwnProperty(styleName)) {
      continue;
    }

    const styleValue = styleObj[styleName];
    if (styleValue != null) {
      const stringifiedStyleValue = dangerousStyleValue(styleName, styleValue);
      if (process.env.NODE_ENV !== 'production') {
        if (stringifiedStyleValue === '[object Object]') {
          console.warn(`Style value for ${styleName} evaluated to an object`);
        } else if (styleValue !== '' && stringifiedStyleValue === '') {
          console.warn(`Style value for ${styleName} evaluated to an empty string`);
        }
      }
      serialized += '\n  ' + hyphenateStyleName(styleName) + ':';
      serialized += stringifiedStyleValue + ';';
    }
  }
  return serialized ? serialized + '\n' : null;
}

module.exports = createMarkupForStyles;
