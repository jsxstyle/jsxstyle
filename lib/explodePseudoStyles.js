'use strict'

function explodePseudoStyles(style) {
  var hoverStyles = null;
  var activeStyles = null;
  var focusStyles = null;
  var baseStyles = null;

  for (var name in style) {
    if (style.hasOwnProperty(name) ) {
      if (name.startsWith('hover')) {
        hoverStyles = hoverStyles || {};
        // Strip the name of the pseudo selector prefix and transform first char
        // to lowercase to ensure correct markup generation and autoprefixing
        var prop = name.substr(5);
        hoverStyles[prop.charAt(0).toLowerCase() + prop.slice(1)] = style[name];
      } else if (name.startsWith('focus')) {
        focusStyles = focusStyles || {};
        var prop = name.substr(5);
        focusStyles[prop.charAt(0).toLowerCase() + prop.slice(1)] = style[name];
      } else if (name.startsWith('active')) {
        activeStyles = activeStyles || {};
        var prop = name.substr(6);
        activeStyles[prop.charAt(0).toLowerCase() + prop.slice(1)] = style[name];
      } else {
        baseStyles = baseStyles || {};
        baseStyles[name] = style[name];
      }
    }
  }

  return {
    base: baseStyles,
    hover: hoverStyles,
    focus: focusStyles,
    active: activeStyles
  };
}

module.exports = explodePseudoStyles;
