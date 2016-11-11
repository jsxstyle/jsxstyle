'use strict';

function stripPrefixFromStyleProp(styleProp, prefix) {
  const formattedProp = styleProp.substr(prefix.length);
  if (formattedProp.indexOf('Webkit') === 0 || formattedProp.indexOf('Moz') === 0) {
    return formattedProp;
  }
  return formattedProp.charAt(0).toLowerCase() + formattedProp.slice(1);
}

function explodePseudoStyles(style) {
  const styleObject = {};

  for (const name in style) {
    if (style.hasOwnProperty(name)) {
      let prefix = 'base';
      let styleProp = name;

      if (name.indexOf('hover') === 0) {
        prefix = 'hover';
      } else if (name.indexOf('focus') === 0) {
        prefix = 'focus';
      } else if (name.indexOf('active') === 0) {
        prefix = 'active';
      }

      if (prefix !== 'base') {
        styleProp = stripPrefixFromStyleProp(styleProp, prefix);
      }

      styleObject[prefix] = styleObject[prefix] || {};
      styleObject[prefix][styleProp] = style[name];
    }
  }

  return styleObject;
}

module.exports = explodePseudoStyles;
