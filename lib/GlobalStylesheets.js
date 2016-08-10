'use strict';

var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');

var assign = require('object-assign');
var autoprefix = require('./autoprefix');
var invariant = require('invariant');

var PREFIX = 'jsxstyle';

var stylesheetIdSeed = 0;

var styles = {};

var browser = typeof document !== 'undefined';

function addStyle(css){
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);

  return style;
}

function createStylesheet(stylesheet) {
  var style = assign({}, stylesheet.style);
  var hoverStyles = {};
  var activeStyles = {};
  var focusStyles = {};

  Object.keys(style).forEach(function(key) {
    if (key.indexOf('hover') === 0) {
      // Strip the key of the pseudo selector prefix and transform first char
      // to lowercase to ensure correct markup generation and autoprefixing
      var prop = key.substr(5);
      hoverStyles[prop.charAt(0).toLowerCase() + prop.slice(1)] = style[key];
      // Remove the key from main style entry
      delete style[key];
    }
    if (key.indexOf('focus') === 0) {
      var prop = key.substr(5);
      focusStyles[prop.charAt(0).toLowerCase() + prop.slice(1)] = style[key];
      delete style[key];
    }
    if (key.indexOf('active') === 0) {
      var prop = key.substr(6);
      activeStyles[prop.charAt(0).toLowerCase() + prop.slice(1)] = style[key];
      delete style[key];
    }
  });

  autoprefix(style);
  var stylesheetText = (
    '\n.' + PREFIX + stylesheet.id + ' {\n' +
      CSSPropertyOperations.createMarkupForStyles(style) +
      '\n}\n'
  );

  // Generate CSS for any pseudo selector props
  if (Object.keys(hoverStyles).length > 0) {
    autoprefix(hoverStyles)
    stylesheetText += (
      '\n.' + PREFIX + stylesheet.id + ':hover {\n' +
        CSSPropertyOperations.createMarkupForStyles(hoverStyles) +
        '\n}\n'
    )
  }

  if (Object.keys(focusStyles).length > 0) {
    autoprefix(focusStyles)
    stylesheetText += (
      '\n.' + PREFIX + stylesheet.id + ':focus {\n' +
        CSSPropertyOperations.createMarkupForStyles(focusStyles) +
        '\n}\n'
    )
  }

  if (Object.keys(activeStyles).length > 0) {
    autoprefix(activeStyles)
    stylesheetText += (
      '\n.' + PREFIX + stylesheet.id + ':active {\n' +
        CSSPropertyOperations.createMarkupForStyles(activeStyles) +
        '\n}\n'
    )
  }

  return addStyle(stylesheetText);
}

function reap() {
  for (var key in styles) {
    if (styles[key].refs === 0) {
      if (styles[key].domNode) {
        styles[key].domNode.remove();
      }
      delete styles[key];
    }
  }
}

var GlobalStylesheets = {
  install: function() {
    if (browser) {
      setInterval(reap, 10000);
    }
  },

  getKey: function(styleObj) {
    var pairs = [];

    Object.keys(styleObj).sort().forEach(function(key) {
      var value = styleObj[key];
      if (typeof value !== 'string' && typeof value !== 'number' && value != null) {
        value = value.toString();
      }
      pairs.push(key + ':' + value);
    });

    var key = pairs.join(',');

    if (!styles.hasOwnProperty(key)) {
      var stylesheet = {
        id: stylesheetIdSeed,
        style: styleObj,
        refs: 0,
      };
      if (browser) {
        stylesheet.domNode = createStylesheet(stylesheet);
        document.head.appendChild(stylesheet.domNode);
      }
      styles[key] = stylesheet;

      stylesheetIdSeed++;
    }

    return key;
  },

  ref: function(key) {
    styles[key].refs++;
  },

  unref: function(key) {
    --styles[key].refs;
  },

  getClassName: function(key) {
    return PREFIX + styles[key].id;
  },
};

module.exports = GlobalStylesheets;
