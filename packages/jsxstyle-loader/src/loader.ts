import fs = require('fs');
import invariant = require('invariant');
import loaderUtils = require('loader-utils');
import path = require('path');
import util = require('util');
import webpack = require('webpack');

import { CacheObject, LoaderOptions, PluginContext } from './types';
import extractStyles from './utils/ast/extractStyles';

const counter: any = Symbol.for('counter');

const jsxstyleLoader: webpack.loader.Loader = function(content) {
  if (this.cacheable) {
    this.cacheable();
  }

  const pluginContext: PluginContext = this[Symbol.for('jsxstyle-loader')];

  invariant(
    pluginContext,
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const options: LoaderOptions = loaderUtils.getOptions(this) || {};

  if (options.cacheFile && pluginContext.cacheFile !== options.cacheFile) {
    try {
      const newCacheObject: CacheObject = {};

      if (fs.existsSync(options.cacheFile)) {
        const cacheFileContents = fs.readFileSync(options.cacheFile, 'utf8');

        // create mapping of unique CSS strings to class names
        const lines = new Set<string>(cacheFileContents.trim().split('\n'));
        let lineCount = 0;
        lines.forEach(line => {
          const className = '_x' + (lineCount++).toString(36);
          newCacheObject[line] = className;
        });

        // set counter
        newCacheObject[counter] = lineCount;
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
      errorCallback: (str: string, ...args: any[]) =>
        this.emitError(new Error(util.format(str, ...args))),
      warnCallback: (str: string, ...args: any[]) =>
        this.emitWarning(new Error(util.format(str, ...args))),
    },
    options
  );

  if (!rv.cssFileName || rv.css.length === 0) {
    return content;
  }

  memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
  memoryFS.writeFileSync(rv.cssFileName, rv.css);
  this.callback(null, rv.js, rv.map);

  return;
};

export = jsxstyleLoader;
