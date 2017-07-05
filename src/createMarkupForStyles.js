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
        const errorCallback =
          arguments.length > 1 && typeof arguments[1] === 'function'
            ? arguments[1]
            : e => console.warn(e); // eslint-disable-line no-console
        if (stringifiedStyleValue === '[object Object]') {
          errorCallback(
            `Style value for ${styleName} evaluated to [object Object]`,
            styleName,
            styleValue,
            stringifiedStyleValue
          );
        } else if (styleValue !== '' && stringifiedStyleValue === '') {
          errorCallback(
            `Style value for ${styleName} evaluated to an empty string`,
            styleName,
            styleValue,
            stringifiedStyleValue
          );
        }
      }
      serialized += '\n  ' + hyphenateStyleName(styleName) + ':';
      serialized += stringifiedStyleValue + ';';
    }
  }
  return serialized ? serialized + '\n' : null;
}

module.exports = createMarkupForStyles;
