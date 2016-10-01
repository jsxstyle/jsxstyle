var generateSha = require('git-sha1');
var invariant = require('invariant');

var PREFIX = 'jsxstyle';

var stylesheetIdSeed = 0;

export const defaultConfig = {
  getStylesheetId: () => stylesheetIdSeed++,
  formatClassNameFromStylesheet: (ss) => PREFIX + ss.id,
};

export function validateConfig(config = {}) {
  const {autoprefix, getStylesheetId, formatClassNameFromStylesheet} = config;
  if (autoprefix) {
    invariant(typeof autoprefix === 'function', 'You may only inject functions for autoprefix');
  }
  if (getStylesheetId) {
    invariant(typeof getStylesheetId === 'function', 'getStylesheetId must be a function');
  }
  if (formatClassNameFromStylesheet) {
    invariant(typeof formatClassNameFromStylesheet === 'function', 'formatClassNameFromStylesheet must be a function');
  }
}
