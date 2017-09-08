'use strict';
/* eslint-disable no-var */

var factory = require('./lib/makePreactStyleComponentClass');
var jsxstyleDefaults = require('./lib/jsxstyleDefaults');

module.exports = {};

for (var name in jsxstyleDefaults) {
  module.exports[name] = factory(name, jsxstyleDefaults[name]);
}
