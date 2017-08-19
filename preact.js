'use strict';
/* eslint-disable no-var */

var factory = require('./lib/makePreactStyleComponentClass');
var jsxstyleDefaults = require('./lib/jsxstyleDefaults');

module.exports = {
  install: function install() {
    // eslint-disable-next-line no-console
    console.error(
      'jsxstyle.install is no longer required and will be removed in jsxstyle 2.0'
    );
  },
};

for (var name in jsxstyleDefaults) {
  module.exports[name] = factory(name, jsxstyleDefaults[name]);
}
