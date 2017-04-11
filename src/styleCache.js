'use strict';

const invariant = require('invariant');
const explodePseudoStyles = require('./explodePseudoStyles');
const createCSS = require('./createCSS');
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

  const baseStyleText = createCSS(explodedStyles.base, className);
  const hoverStyleText = createCSS(explodedStyles.hover, className, ':hover');
  const activeStyleText = createCSS(explodedStyles.active, className, ':active');
  const focusStyleText = createCSS(explodedStyles.focus, className, ':focus');

  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.appendChild(document.createTextNode(`/* ${className} */`));
  document.head.appendChild(styleElement);
  stylesheet.domNode = styleElement;

  let idx = 0;
  if (baseStyleText !== '') {
    styleElement.sheet.insertRule(baseStyleText, idx++);
  }
  if (hoverStyleText !== '') {
    styleElement.sheet.insertRule(hoverStyleText, idx++);
  }
  if (activeStyleText !== '') {
    styleElement.sheet.insertRule(activeStyleText, idx++);
  }
  if (focusStyleText !== '') {
    styleElement.sheet.insertRule(focusStyleText, idx++);
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
