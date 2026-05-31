import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DependencyAnalysisCache,
  extractImportSpecifiers,
  transform,
} from '@jsxstyle/bundler-utils';
import type * as webpack from 'webpack';
import type { PluginContext } from './types.js';

const pluginSymbol = Symbol.for('jsxstyle-webpack-plugin');

const JSXSTYLE_IMPORT_RE = /['"]@jsxstyle\//;

// Module-level dependency analysis cache, shared across loader invocations
const depCache = new DependencyAnalysisCache();

export default function jsxstyleLoader(
  this: webpack.LoaderContext<Record<string, never>> & {
    [key: symbol]: PluginContext;
  },
  content: string | Buffer
) {
  if (this.cacheable) {
    this.cacheable();
  }

  if (this.resourcePath.startsWith('data:')) {
    return;
  }

  const callback = this.async();

  const pluginContext = this[pluginSymbol];

  if (!pluginContext) {
    callback(
      new Error(
        'jsxstyle/webpack-plugin must be added to the plugins array in your webpack config'
      )
    );
    return;
  }

  const { memoryFS, pluginOptions, cacheObject } = pluginContext;

  try {
    const source =
      typeof content === 'string' ? content : content.toString('utf8');

    const transformOptions = {
      classNameStrategy: pluginOptions.classNameStrategy,
      classNamePrefix: pluginOptions.classNamePrefix,
      debugClassNames: pluginOptions.debugClassNames,
      noRuntime: pluginOptions.noRuntime,
      cacheObject,
    };

    // Analyze dependencies for external bindings when this file imports from jsxstyle
    let externalBindings: Record<string, Record<string, unknown>> | undefined;
    if (JSXSTYLE_IMPORT_RE.test(source)) {
      const specifiers = extractImportSpecifiers(source);
      if (specifiers.length > 0) {
        externalBindings = {};
        for (const specifier of specifiers) {
          try {
            const resolvedPath = require.resolve(specifier, {
              paths: [path.dirname(this.resourcePath)],
            });
            const depSource = fs.readFileSync(resolvedPath, 'utf8');
            const staticExports = depCache.analyze(
              resolvedPath,
              depSource,
              transformOptions
            );
            if (Object.keys(staticExports).length > 0) {
              externalBindings[specifier] = staticExports;
              // Register dependency for watch mode
              this.addDependency(resolvedPath);
            }
          } catch {
            // Skip dependencies that can't be resolved or read
          }
        }
        if (Object.keys(externalBindings).length === 0) {
          externalBindings = undefined;
        }
      }
    }

    const result = transform(source, this.resourcePath, {
      ...transformOptions,
      externalBindings,
    });

    // Route warnings through webpack's warning system
    for (const warning of result.warnings) {
      this.emitWarning(new Error(warning));
    }

    // Route errors through webpack's error system
    for (const error of result.errors) {
      this.emitError(new Error(error));
    }

    // If noRuntime is 'error' and there are errors, fail the build
    if (pluginOptions.noRuntime === 'error' && result.errors.length > 0) {
      callback(new Error(result.errors.join('\n')));
      return;
    }

    // Update the shared cache with new entries from this transform
    Object.assign(cacheObject, result.cacheObject);

    if (!result.cssFileName || result.css.length === 0) {
      callback(null, source);
      return;
    }

    // Write CSS to memfs for virtual file delivery
    memoryFS.mkdirSync(path.dirname(result.cssFileName), { recursive: true });
    memoryFS.writeFileSync(result.cssFileName, result.css);

    // Add CSS import to the transformed code so webpack processes the virtual CSS file.
    // Must use `import` (not `require`) since the SWC transform output uses ES modules,
    // and webpack's ESM parser ignores `require()` in harmony modules.
    const cssImport = `import ${JSON.stringify('./' + path.basename(result.cssFileName))};\n`;
    callback(null, cssImport + result.code, result.map);
  } catch (err) {
    callback(err as Error);
  }
}
