'use strict';

var explodePseudoStyles = require('./explodePseudoStyles');
var createCSS = require('./createCSS');

var assign = require('object-assign');
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
  var styles = explodePseudoStyles(assign({}, stylesheet.style));
  var className = PREFIX + stylesheet.id;
  var stylesheetText = [
    createCSS(styles.base, className, null),
    createCSS(styles.hover, className, null, ':hover'),
    createCSS(styles.active, className, null, ':active'),
    createCSS(styles.focus, className, null, ':focus')
  ].join('');

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
