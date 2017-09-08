'use strict';
/* eslint-disable no-var */

var factory = require('./lib/makePreactStyleComponentClass');
var jsxstyleDefaults = require('./lib/jsxstyleDefaults');
var styleCache = require('./lib/styleCache');

module.exports = {
  injectAddRule: styleCache.injectAddRule,
  injectClassNameStrategy: styleCache.injectClassNameStrategy,
};

for (var name in jsxstyleDefaults) {
  module.exports[name] = factory(name, jsxstyleDefaults[name]);
}
