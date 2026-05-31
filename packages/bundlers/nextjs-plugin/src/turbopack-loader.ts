import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DependencyAnalysisCache,
  extractImportSpecifiers,
  transform,
} from '@jsxstyle/bundler-utils';

interface TurbopackLoaderOptions {
  classNameStrategy?: 'counter' | 'hash';
  classNamePrefix?: string;
  debugClassNames?: boolean;
  noRuntime?: 'warn' | 'error';
}

const JSXSTYLE_IMPORT_RE = /['"]@jsxstyle\//;

// Module-level cache shared across all loader invocations in the same process.
// For hash strategy, this is optional (hashes are deterministic).
// For counter strategy, this ensures consistent class names across client/server.
const sharedCacheObject: Record<string, string> = {};

// Module-level dependency analysis cache
const depCache = new DependencyAnalysisCache();

export default function jsxstyleTurbopackLoader(this: any, source: string) {
  const callback = this.async();
  const options: TurbopackLoaderOptions = this.getOptions();

  try {
    const resolvedDebugClassNames =
      options.debugClassNames !== undefined
        ? options.debugClassNames
        : process.env.NODE_ENV === 'development';

    const transformOptions = {
      classNameStrategy: options.classNameStrategy ?? 'hash',
      classNamePrefix: options.classNamePrefix ?? '_x',
      debugClassNames: resolvedDebugClassNames,
      cacheObject: sharedCacheObject,
      noRuntime: options.noRuntime,
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
    Object.assign(sharedCacheObject, result.cacheObject);

    // Report errors and warnings via loader context
    for (const msg of result.warnings) {
      this.emitWarning(new Error(msg));
    }
    for (const msg of result.errors) {
      this.emitError(new Error(msg));
    }

    if (options.noRuntime === 'error' && result.errors.length > 0) {
      callback(new Error(result.errors.join('\n')));
      return;
    }

    if (result.cssFileName && result.css.length > 0) {
      // Write CSS to disk as plain .css — Turbopack picks up CSS imports natively.
      // No .module.css needed since we target App Router only (Next.js 13.4+).
      const cssFileName =
        this.resourcePath.replace(/\.[^.]+$/, '') + '.jsxstyle.css';

      // Atomic write: only write if content changed (avoid unnecessary recompilation)
      let existing: string | null = null;
      try {
        existing = fs.readFileSync(cssFileName, 'utf8');
      } catch {}
      if (existing !== result.css) {
        fs.writeFileSync(cssFileName, result.css);
      }

      // Tell Turbopack to watch this file
      this.addDependency(cssFileName);

      // Inject CSS import at top of transformed code
      const cssImport = `import './${path.basename(cssFileName)}';\n`;
      callback(null, cssImport + result.code, result.map);
    } else {
      callback(null, result.code, result.map);
    }
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}
