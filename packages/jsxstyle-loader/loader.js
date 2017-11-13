'use strict';

const extractStyles = require('./utils/ast/extractStyles');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');
const path = require('path');
const util = require('util');

const jsxstyleKey = Symbol.for('jsxstyle-loader');

function jsxstyleLoader(content) {
  this.cacheable && this.cacheable();

  invariant(
    this[jsxstyleKey],
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const { memoryFS, cacheObject, liteMode } = this[jsxstyleKey];

  const options = loaderUtils.getOptions(this) || {};

  const rv = extractStyles(
    content,
    this.resourcePath,
    {
      cacheObject,
      errorCallback: (...args) =>
        this.emitWarning(new Error(util.format(...args))),
    },
    Object.assign({ liteMode }, options)
  );

  if (rv.css.length === 0) {
    return content;
  }

  memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
  memoryFS.writeFileSync(rv.cssFileName, rv.css);
  this.callback(null, rv.js, rv.map, rv.ast);
}

module.exports = jsxstyleLoader;
