'use strict';

const explodePseudoStyles = require('./explodePseudoStyles');
const createCSS = require('./createCSS');

let stylesheetIdSeed = 0;

const styleCache = {};

const browser = typeof document !== 'undefined';

function addStyle(css) {
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);

  return style;
}

function createStylesheet(stylesheet) {
  const explodedStyles = explodePseudoStyles(Object.assign({}, stylesheet.style));
  const className = GlobalStylesheets.injection.formatClassNameFromId(stylesheet.id);
  const stylesheetText = [
    createCSS(explodedStyles.base, className, null),
    createCSS(explodedStyles.hover, className, null, ':hover'),
    createCSS(explodedStyles.active, className, null, ':active'),
    createCSS(explodedStyles.focus, className, null, ':focus'),
  ].join('');

  return addStyle(stylesheetText);
}

function reap() {
  for (const key in styleCache) {
    if (styleCache[key].refs === 0) {
      if (styleCache[key].domNode) {
        removeNode(styleCache[key].domNode);
      }
      delete styleCache[key];
    }
  }
}

function removeNode(node) {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

const GlobalStylesheets = {
  install() {
    if (browser) {
      setInterval(reap, 10000);
    }
  },

  // eslint-disable-next-line no-unused-vars
  getKey(styleObj, displayName, component) {
    const pairs = [];

    Object.keys(styleObj).sort().forEach(function(key) {
      let value = styleObj[key];

      if (!value) {
        return;
      }

      if (typeof value !== 'string' && typeof value !== 'number' && value != null) {
        value = value.toString();
      }
      pairs.push(key + ':' + value);
    });

    if (pairs.length === 0) {
      return null;
    }

    const key = pairs.join(',');

    if (!styleCache.hasOwnProperty(key)) {
      const stylesheet = {
        id: GlobalStylesheets.injection.getStylesheetId(styleObj),
        style: styleObj,
        refs: 0,
      };
      if (browser) {
        stylesheet.domNode = createStylesheet(stylesheet);
        document.head.appendChild(stylesheet.domNode);
      }
      styleCache[key] = stylesheet;
    }

    return key;
  },

  ref(key) {
    styleCache[key].refs++;
  },

  unref(key) {
    styleCache[key].refs--;
  },

  getClassName(styleKey) {
    return GlobalStylesheets.injection.formatClassNameFromId(styleCache[styleKey].id);
  },

  injection: {
    // eslint-disable-next-line no-unused-vars
    getStylesheetId(styleKey) {
      return stylesheetIdSeed++;
    },

    formatClassNameFromId(id) {
      return `jsxstyle${id}`;
    },
  },
};

module.exports = GlobalStylesheets;
