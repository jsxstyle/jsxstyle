'use strict';

const invariant = require('invariant');

const styleCache = {};
const browserIsAvailable = typeof document !== 'undefined';

function reap() {
  for (const key in styleCache) {
    if (styleCache[key].refs < 1) {
      if (styleCache[key].domNode) {
        const node = styleCache[key].domNode;
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
      delete styleCache[key];
    }
  }
}

let reaper = null;
function installReaper(intervalMS = 10000) {
  invariant(!reaper, 'jsxstyle stylesheet reaper has already been installed');
  if (browserIsAvailable) {
    reaper = setInterval(reap, intervalMS);
  }
}

if (module.hot) {
  // stop garbage collection when module is replaced
  module.hot.dispose(function() {
    clearInterval(reaper);
    reaper = null;
  });
}

function refClassName(className, styleObj) {
  if (styleCache.hasOwnProperty(className)) {
    styleCache[className].refs++;
    return;
  }

  const stylesheet = { refs: 1 };
  styleCache[className] = stylesheet;

  if (!browserIsAvailable) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(`/* ${className} */`));
  document.head.appendChild(styleElement);
  stylesheet.domNode = styleElement;

  let styleString =
    `.${className}` +
    (styleObj.pseudoclass ? ':' + styleObj.pseudoclass : '') +
    (styleObj.placeholder ? '::placeholder' : '') +
    ` {${styleObj.css}}`;

  if (styleObj.mediaQuery) {
    styleString = `@media ${styleObj.mediaQuery} { ${styleString} }`;
  }

  if (process.env.NODE_ENV === 'production') {
    styleElement.sheet.insertRule(styleString, 0);
  } else {
    styleElement.appendChild(document.createTextNode(styleString));
  }
}

function unrefClassName(className) {
  styleCache[className].refs--;
}

module.exports = {
  installReaper,
  refClassName,
  unrefClassName,
};
