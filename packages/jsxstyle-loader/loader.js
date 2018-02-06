'use strict';

const extractStyles = require('./utils/ast/extractStyles');

const invariant = require('invariant');
const loaderUtils = require('loader-utils');
const path = require('path');
const util = require('util');
const fs = require('fs');

function jsxstyleLoader(content) {
  this.cacheable && this.cacheable();

  const pluginContext = this[Symbol.for('jsxstyle-loader')];

  invariant(
    pluginContext,
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const options = loaderUtils.getOptions(this) || {};

  if (options.cacheFile && pluginContext.cacheFile !== options.cacheFile) {
    try {
      const newCacheObject = {};

      if (fs.existsSync(options.cacheFile)) {
        const cacheFileContents = fs.readFileSync(options.cacheFile, 'utf8');

        // create mapping of unique CSS strings to class names
        const lines = new Set(cacheFileContents.trim().split('\n'));
        let lineCount = 0;
        lines.forEach(line => {
          const className = '_x' + (lineCount++).toString(36);
          newCacheObject[line] = className;
        });

        // set counter
        newCacheObject[Symbol.for('counter')] = lineCount;
      }

      pluginContext.cacheObject = newCacheObject;
    } catch (err) {
      if (err.code === 'EISDIR') {
        this.emitError(new Error('cacheFile is a directory'));
      } else {
        this.emitError(err);
      }
      // create a new cache object anyway, since the author's intent was to use a separate cache object.
      pluginContext.cacheObject = {};
    }
    pluginContext.cacheFile = options.cacheFile;
  }

  const { memoryFS, cacheObject } = pluginContext;

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
