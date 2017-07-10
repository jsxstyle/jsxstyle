'use strict';

const browserIsAvailable = typeof document !== 'undefined';

let styleCache;
let styleElement;
let styleIndex = -1;

if (module.hot) {
  if (typeof module.hot.data === 'object') {
    styleCache = module.hot.data.styleCache;
    styleElement = module.hot.data.styleElement;
    styleIndex = module.hot.data.styleIndex;
  }

  module.hot.addDisposeHandler(function(data) {
    data.styleCache = styleCache;
    data.styleElement = styleElement;
    data.styleIndex = styleIndex;
  });
}

if (!styleCache) {
  styleCache = {};
}

if (browserIsAvailable && !styleElement) {
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode('/* jsxstyle */'));
  document.head.appendChild(styleElement);
}

function addStyleToHead(className, styleObj) {
  if (!browserIsAvailable || styleCache.hasOwnProperty(className)) {
    return;
  }

  let styleString =
    `.${className}` +
    (styleObj.pseudoclass ? ':' + styleObj.pseudoclass : '') +
    (styleObj.pseudoelement ? '::' + styleObj.pseudoelement : '') +
    ` {${styleObj.css}}`;

  if (styleObj.mediaQuery) {
    styleString = `@media ${styleObj.mediaQuery} { ${styleString} }`;
  }

  styleCache[className] = true;
  styleElement.sheet.insertRule(styleString, ++styleIndex);
}

module.exports = addStyleToHead;
