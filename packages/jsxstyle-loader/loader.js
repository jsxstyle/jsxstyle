'use strict';

const extractStyles = require('./utils/ast/extractStyles');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');
const path = require('path');
const util = require('util');
const validateOptions = require('schema-utils');

const jsxstyleKey = Symbol.for('jsxstyle-loader');

function jsxstyleLoader(content) {
  this.cacheable && this.cacheable();

  invariant(
    this[jsxstyleKey],
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const { memoryFS, cacheObject, liteMode } = this[jsxstyleKey];

  const options = loaderUtils.getOptions(this) || {};

  validateOptions(
    path.resolve(__dirname, './schema/loader.json'),
    options,
    'jsxstyle-loader'
  );

  const rv = extractStyles({
    src: content,
    sourceFileName: this.resourcePath,
    whitelistedModules: options.whitelistedModules,
    styleGroups: options.styleGroups,
    namedStyleGroups: options.namedStyleGroups,
    parserPlugins: options.parserPlugins,
    classNameFormat: options.classNameFormat,
    cacheObject,
    liteMode: options.liteMode == null ? liteMode : options.liteMode,
    errorCallback: (...args) =>
      this.emitWarning(new Error(util.format(...args))),
  });

  if (rv.css.length === 0) {
    return content;
  }

  memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
  memoryFS.writeFileSync(rv.cssFileName, rv.css);
  this.callback(null, rv.js, rv.map, rv.ast);
}

module.exports = jsxstyleLoader;
