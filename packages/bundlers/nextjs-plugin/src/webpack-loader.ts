import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DependencyAnalysisCache,
  extractImportSpecifiers,
  transform,
} from '@jsxstyle/bundler-utils';
import type { MemoryFS } from '@jsxstyle/bundler-utils';

// WeakMap keyed by compiler instance so each webpack invocation
// (nodejs server, edge server, client) has its own isolated context.
// Next.js fires the webpack callback 3 times, each with its own compiler.
// A module-level singleton would be overwritten by each call.
interface WebpackLoaderContext {
  pluginOptions: Record<string, unknown>;
  cacheObject: Record<string, string>;
  memoryFS: MemoryFS;
}

const contextByCompiler = new WeakMap<object, WebpackLoaderContext>();

export function setContext(compiler: object, ctx: WebpackLoaderContext) {
  contextByCompiler.set(compiler, ctx);
}

const JSXSTYLE_IMPORT_RE = /['"]@jsxstyle\//;

// Module-level dependency analysis cache, shared across loader invocations
const depCache = new DependencyAnalysisCache();

export default function jsxstyleWebpackLoader(
  this: any,
  source: string,
  _sourceMap?: any
) {
  if (this.cacheable) this.cacheable();
  if (this.resourcePath.startsWith('data:')) return;

  const callback = this.async();
  const compiler = this._compiler;
  const ctx = contextByCompiler.get(compiler);
  if (!ctx) {
    callback(
      new Error('jsxstyle/nextjs-plugin must be configured via withJsxstyle()')
    );
    return;
  }

  const { pluginOptions, cacheObject, memoryFS } = ctx;

  try {
    const transformOptions = {
      ...pluginOptions,
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

    if (pluginOptions.noRuntime === 'error' && result.errors.length > 0) {
      callback(new Error(result.errors.join('\n')));
      return;
    }

    if (result.cssFileName && result.css.length > 0) {
      // Write CSS to memfs virtual filesystem
      memoryFS.mkdirSync(path.dirname(result.cssFileName), { recursive: true });
      memoryFS.writeFileSync(result.cssFileName, result.css);

      // Inject CSS import (must use `import` for ESM harmony module compatibility)
      const cssImport = `import ${JSON.stringify('./' + path.basename(result.cssFileName))};\n`;
      callback(null, cssImport + result.code, result.map);
    } else {
      callback(null, result.code, result.map);
    }
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}
