'use strict';

function stripPrefixFromStyleProp(styleProp, prefix) {
  const formattedProp = styleProp.substr(prefix.length);
  if (formattedProp.startsWith('Webkit') || formattedProp.startsWith('Moz')) {
    return formattedProp;
  }
  return formattedProp.charAt(0).toLowerCase() + formattedProp.slice(1);
}

function explodePseudoStyles(style) {
  const styleObject = {};

  for (const name in style) {
    if (name === 'name') {
      continue;
    }

    if (style.hasOwnProperty(name)) {
      let prefix = 'base';
      let styleProp = name;

      if (name.startsWith('hover')) {
        prefix = 'hover';
      } else if (name.startsWith('focus')) {
        prefix = 'focus';
      } else if (name.startsWith('active')) {
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
