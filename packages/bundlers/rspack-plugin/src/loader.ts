import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DependencyAnalysisCache,
  extractImportSpecifiers,
  transform,
} from '@jsxstyle/bundler-utils';
import { pluginRegistry } from './plugin.js';

interface LoaderOptions {
  pluginInstanceId: string;
}

const JSXSTYLE_IMPORT_RE = /['"]@jsxstyle\//;

// Module-level dependency analysis cache, shared across loader invocations
const depCache = new DependencyAnalysisCache();

export default function jsxstyleRspackLoader(this: any, source: string) {
  const callback = this.async();
  const options: LoaderOptions = this.getOptions();
  const entry = pluginRegistry.get(options.pluginInstanceId);

  if (!entry) {
    callback(
      new Error(
        'JsxstyleRspackPlugin must be added to your Rspack config plugins array'
      )
    );
    return;
  }

  const { pluginOptions, cacheObject, writeVirtualModule } = entry;

  try {
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

    // Update shared cache
    Object.assign(cacheObject, result.cacheObject);

    // Report errors and warnings
    for (const msg of result.warnings) {
      this.emitWarning(new Error(msg));
    }
    for (const msg of result.errors) {
      this.emitError(new Error(msg));
    }

    // If noRuntime error mode and errors found, fail
    if (pluginOptions.noRuntime === 'error' && result.errors.length > 0) {
      callback(new Error(result.errors.join('\n')));
      return;
    }

    if (result.cssFileName && result.css.length > 0) {
      // Write CSS to virtual module
      writeVirtualModule(result.cssFileName, result.css);

      // Inject CSS import at top of transformed code.
      // Must use `import` (not `require`) since the SWC transform output uses ES modules,
      // and Rspack's ESM parser ignores `require()` in harmony modules.
      const cssImport = `import ${JSON.stringify('./' + path.basename(result.cssFileName))};\n`;
      callback(null, cssImport + result.code, result.map);
    } else {
      callback(null, result.code, result.map);
    }
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}
