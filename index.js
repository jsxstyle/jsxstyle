'use strict';

const Addons = require('./lib/Addons');
const Color = require('./lib/Color');
const Display = require('./lib/Display');
const GlobalStylesheets = require('./lib/GlobalStylesheets');

const createCSS = require('./lib/createCSS');
const invariant = require('invariant');

const index = Object.assign({
  install: GlobalStylesheets.install,
  injectAutoprefixer(autoprefix) {
    invariant(typeof autoprefix === 'function', 'You may only inject functions for autoprefix');
    createCSS.injection.autoprefix = autoprefix;
  },
  injectClassNameStrategy(getStylesheetId, formatClassNameFromId) {
    if (getStylesheetId) {
      invariant(typeof getStylesheetId === 'function', 'getStylesheetId must be a function');
      GlobalStylesheets.injection.getStylesheetId = getStylesheetId;
    }

    if (formatClassNameFromId) {
      invariant(typeof formatClassNameFromId === 'function', 'formatClassNameFromId must be a function');
      GlobalStylesheets.injection.formatClassNameFromId = formatClassNameFromId;
    }
  },
}, Color, Display, Addons);

module.exports = index;
