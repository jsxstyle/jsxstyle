'use strict';
/* eslint-disable no-var, object-shorthand, no-console */

var factory = require('./lib/makeReactStyleComponentClass');
var jsxstyleDefaults = require('./lib/jsxstyleDefaults');
var styleCache = require('./lib/styleCache');

module.exports = {
  install: function install__deprecated() {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        '`jsxstyle.install` is no longer required and will be removed in jsxstyle 2.0.'
      );
    }
  },
  injectAddRule: styleCache.injectAddRule,
  injectClassNameStrategy: styleCache.injectClassNameStrategy,
};

for (var name in jsxstyleDefaults) {
  module.exports[name] = factory(name, jsxstyleDefaults[name]);
}

var hasWarnedAboutFlex = false;
if (process.env.NODE_ENV !== 'production') {
  Object.defineProperty(module.exports, 'Flex', {
    get: function Flex__deprecated() {
      if (!hasWarnedAboutFlex) {
        hasWarnedAboutFlex = true;
        console.error(
          'jsxstyle\u2019s `Flex` component is deprecated and will be removed in jsxstyle 2.0. Please use `Row` instead.'
        );
      }
      return module.exports.Row;
    },
  });
} else {
  module.exports.Flex = module.exports.Row;
}
