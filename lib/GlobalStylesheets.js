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
  autoprefix(style);
  return (
    '\n.' + PREFIX + stylesheet.id + ' {' + CSSPropertyOperations.createMarkupForStyles(style) + '}\n'
  );
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
        css:''
      };
      
      stylesheet.css = createStylesheet(stylesheet);
      if (browser) {
        stylesheet.domNode = addStyle(stylesheet.css);
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
  
  toString:function(){
    var style='';
    for (var key in styles) {
      style+=styles[key].css
    }
    return style;
  }
};

module.exports = GlobalStylesheets;
