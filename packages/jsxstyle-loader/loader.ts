import invariant = require('invariant');
import loaderUtils = require('loader-utils');
import path = require('path');
import util = require('util');
import fs = require('fs');

import { LoaderContext, CacheObject } from './utils/types';
import extractStyles from './utils/ast/extractStyles';

const counter = Symbol.for('counter');

const jsxstyleLoader = function jsxstyleLoader(
  // TODO: remove when webpack types suck less
  this: any,
  content: string | Buffer
) {
  this.cacheable && this.cacheable();

  const pluginContext: LoaderContext = this[Symbol.for('jsxstyle-loader')];

  invariant(
    pluginContext,
    'jsxstyle-loader cannot be used without the corresponding plugin'
  );

  const options = loaderUtils.getOptions(this) || {};

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
      warnCallback: (str, ...args: any[]) =>
        this.emitWarning(new Error(util.format(str, ...args))),
      errorCallback: (str, ...args: any[]) =>
        this.emitError(new Error(util.format(str, ...args))),
    },
    options
  );

  if (rv.cssFileName == null || rv.css.length === 0) {
    return content;
  }

  memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
  memoryFS.writeFileSync(rv.cssFileName, rv.css);
  this.callback(null, rv.js, rv.map);

  return;
};

export default jsxstyleLoader;
