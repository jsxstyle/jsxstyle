import invariant from 'invariant';
import * as path from 'path';
import util from 'util';
import type * as webpack from 'webpack';

import type { LoaderOptions, PluginContext } from './types';
import { extractStyles } from '../../jsxstyle-bundler-utils/src/ast/extractStyles';

const pluginSymbol = Symbol.for('jsxstyle-webpack-plugin');

export default async function jsxstyleLoader(
  this: webpack.LoaderContext<LoaderOptions> & { [key: symbol]: PluginContext },
  content: string | Buffer,
  sourceMap?: any
) {
  if (this.cacheable) {
    this.cacheable();
  }

  if (this.resourcePath.startsWith('data:')) {
    return;
  }

  const callback = this.async();
  invariant(callback, 'Async callback is falsey');

  const pluginContext: PluginContext = this[pluginSymbol];

  invariant(
    pluginContext,
    'jsxstyle/webpack-plugin must be added to the plugins array in your webpack config'
  );

  const { memoryFS, getClassNameForKey, getModules, defaultLoaderOptions } =
    pluginContext;

  const userSpecifiedOptions = this.getOptions() || {};

  const options: LoaderOptions = {
    ...defaultLoaderOptions,
    ...userSpecifiedOptions,
  };

  try {
    const modulesByAbsolutePath = await getModules();

    /** If there is an attempt to access a module in `modulesByAbsolutePath`, add it as a dependency */
    const proxiedModulesByAbsolutePath = new Proxy(modulesByAbsolutePath, {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string' && prop.startsWith('/')) {
          this.addDependency(prop);
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    const rv = extractStyles(
      content,
      this.resourcePath,
      {
        getClassNameForKey,
        modulesByAbsolutePath: proxiedModulesByAbsolutePath,
        errorCallback: (str: string, ...args: any[]) =>
          this.emitError(new Error(util.format(str, ...args))),
        warnCallback: (str: string, ...args: any[]) =>
          this.emitWarning(new Error(util.format(str, ...args))),
      },
      options
    );

    // if inline import mode is enabled, no files will be written to the virtual filesystem
    if (!options.cssMode) {
      if (!rv.cssFileName || rv.css.length === 0) {
        callback(null, content, sourceMap);
        return;
      }

      memoryFS.mkdirpSync(path.dirname(rv.cssFileName));
      memoryFS.writeFileSync(rv.cssFileName, rv.css);
    }

    callback(null, rv.js, rv.map);
  } catch (err) {
    callback(err);
  }
}
