'use strict';

const invariant = require('invariant');
const explodePseudoStyles = require('./explodePseudoStyles');
const createMarkupForStyles = require('./createMarkupForStyles');
const getClassName = require('./getClassName');

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

let reaper;
function installReaper(intervalMS = 10000) {
  invariant(!reaper, 'jsxstyle stylesheet reaper has already been installed');
  if (browserIsAvailable) {
    reaper = setInterval(reap, intervalMS);
  }
}

function refKey(key, styleObj) {
  if (styleCache.hasOwnProperty(key)) {
    styleCache[key].refs++;
    return;
  }

  const stylesheet = {
    key,
    style: styleObj,
    refs: 1,
  };
  styleCache[key] = stylesheet;

  if (!browserIsAvailable) {
    return;
  }

  const explodedStyles = explodePseudoStyles(styleObj);
  const className = getClassName(key);

  const baseCSS = createMarkupForStyles(explodedStyles.base);
  const hoverCSS = createMarkupForStyles(explodedStyles.hover);
  const activeCSS = createMarkupForStyles(explodedStyles.active);
  const focusCSS = createMarkupForStyles(explodedStyles.focus);

  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(`/* ${className} */`));
  document.head.appendChild(styleElement);
  stylesheet.domNode = styleElement;

  let idx = 0;
  if (baseCSS) {
    styleElement.sheet.insertRule(`.${className} {${baseCSS}}`, idx++);
  }
  if (hoverCSS) {
    styleElement.sheet.insertRule(`.${className}:hover {${hoverCSS}}`, idx++);
  }
  if (activeCSS) {
    styleElement.sheet.insertRule(`.${className}:active {${activeCSS}}`, idx++);
  }
  if (focusCSS) {
    styleElement.sheet.insertRule(`.${className}:focus {${focusCSS}}`, idx++);
  }
}

function unrefKey(key) {
  styleCache[key].refs--;
}

module.exports = {
  installReaper,
  refKey,
  unrefKey,
};
