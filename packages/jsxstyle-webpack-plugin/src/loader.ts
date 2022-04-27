import invariant = require('invariant');
import path = require('path');
import util = require('util');
import webpack = require('webpack');

import { LoaderOptions, PluginContext } from './types';
import { extractStyles } from './utils/ast/extractStyles';

const jsxstyleLoader = async function (
  this: webpack.LoaderContext<LoaderOptions>,
  content: string | Buffer,
  sourceMap?: any
) {
  if (this.cacheable) {
    this.cacheable();
  }

  const callback = this.async();
  invariant(callback, 'Async callback is falsey');

  const pluginContext: PluginContext = this[
    Symbol.for('jsxstyle-webpack-plugin')
  ];

  invariant(
    pluginContext,
    'jsxstyle-webpack-plugin must be added to the plugins array in your webpack config'
  );

  const {
    memoryFS,
    getClassNameForKey,
    getModules,
    defaultLoaderOptions,
  } = pluginContext;

  const userSpecifiedOptions = this.getOptions() || {};

  const options: LoaderOptions = {
    ...defaultLoaderOptions,
    ...userSpecifiedOptions,
  };

  try {
    const modulesByAbsolutePath = await getModules();

    const rv = extractStyles(
      content,
      this.resourcePath,
      {
        getClassNameForKey,
        modulesByAbsolutePath,
        errorCallback: (str: string, ...args: any[]) =>
          this.emitError(new Error(util.format(str, ...args))),
        warnCallback: (str: string, ...args: any[]) =>
          this.emitWarning(new Error(util.format(str, ...args))),
      },
      options
    );

    if (!rv.cssFileName || rv.css.length === 0) {
      callback(null, content, sourceMap);
      return;
    }

    memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
    memoryFS.writeFileSync(rv.cssFileName, rv.css);

    callback(null, rv.js, rv.map);
  } catch (err) {
    callback(err);
  }
};

export = jsxstyleLoader;
