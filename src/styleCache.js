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

window.disposeData = { styleElement, styleIndex, styleCache };

function reap() {
  for (const key in styleCache) {
    if (styleCache[key].refs < 1) {
      styleElement.sheet.deleteRule(styleCache[key].index);
      styleElement.sheet.insertRule('_p {}', styleCache[key].index);
      // TODO: reuse the ID?
      delete styleCache[key];
    }
  }
}

let reaper = null;
function installReaper(intervalMS = 10000) {
  if (!reaper && browserIsAvailable) {
    reaper = setInterval(reap, intervalMS);
  }
}

function refClassName(className, styleObj) {
  if (styleCache.hasOwnProperty(className)) {
    styleCache[className].refs++;
    return;
  }

  const stylesheet = { refs: 1, index: -1 };
  styleCache[className] = stylesheet;

  if (!browserIsAvailable) {
    return;
  }

  let styleString =
    `.${className}` +
    (styleObj.pseudoclass ? ':' + styleObj.pseudoclass : '') +
    (styleObj.placeholder ? '::placeholder' : '') +
    ` {${styleObj.css}}`;

  if (styleObj.mediaQuery) {
    styleString = `@media ${styleObj.mediaQuery} { ${styleString} }`;
  }

  stylesheet.index = ++styleIndex;
  styleElement.sheet.insertRule(styleString, stylesheet.index);
}

function unrefClassName(className) {
  styleCache[className].refs--;
}

module.exports = {
  installReaper,
  refClassName,
  unrefClassName,
};
