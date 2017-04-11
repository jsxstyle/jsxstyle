'use strict';

function explodePseudoStyles(styleObject) {
  const stylesByPrefix = {};

  for (const name in styleObject) {
    if (styleObject.hasOwnProperty(name)) {
      let prefix = 'base';
      let styleProp = name;

      if (name.indexOf('hover') === 0) {
        prefix = 'hover';
      } else if (name.indexOf('focus') === 0) {
        prefix = 'focus';
      } else if (name.indexOf('active') === 0) {
        prefix = 'active';
      }

      // skip prefix-only props (edge case)
      if (prefix === name) {
        continue;
      }

      if (prefix !== 'base') {
        const formattedProp = styleProp.substr(prefix.length);
        if (formattedProp.indexOf('Webkit') === 0 || formattedProp.indexOf('Moz') === 0) {
          styleProp = formattedProp;
        } else {
          styleProp = formattedProp.charAt(0).toLowerCase() + formattedProp.slice(1);
        }
      }

      stylesByPrefix[prefix] = stylesByPrefix[prefix] || {};
      stylesByPrefix[prefix][styleProp] = styleObject[name];
    }
  }

  return stylesByPrefix;
}

module.exports = explodePseudoStyles;
