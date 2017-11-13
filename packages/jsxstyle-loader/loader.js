'use strict';

const extractStyles = require('./utils/ast/extractStyles');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');
const path = require('path');
const util = require('util');

function jsxstyleLoader(content) {
  this.cacheable && this.cacheable();

  const pluginContext = this[Symbol.for('jsxstyle-loader')];

  invariant(
    pluginContext,
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const { memoryFS, cacheObject } = pluginContext;

  const options = loaderUtils.getOptions(this) || {};

  const rv = extractStyles(
    content,
    this.resourcePath,
    {
      cacheObject,
      warnCallback: (...args) =>
        this.emitWarning(new Error(util.format(...args))),
      errorCallback: (...args) =>
        this.emitError(new Error(util.format(...args))),
    },
    options
  );

  if (rv.css.length === 0) {
    return content;
  }

  memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
  memoryFS.writeFileSync(rv.cssFileName, rv.css);
  this.callback(null, rv.js, rv.map, rv.ast);
}

module.exports = jsxstyleLoader;
