import { createRequire } from 'node:module';
import * as path from 'node:path';
import type { PluginTransformResult } from './types.js';

export type {
  PluginOptions,
  PluginTransformResult,
  MemoryFS,
} from './types.js';
export { validateOptions } from './validation.js';
export { wrapFileSystem } from './wrapFileSystem.js';
export { DependencyAnalysisCache } from './DependencyAnalysisCache.js';

// --- NAPI binding loader ---

interface NativeBinding {
  transform(
    source: string,
    filename: string,
    options: {
      classNameStrategy: string;
      classNamePrefix: string;
      debugClassNames?: boolean;
      cacheObject?: Record<string, string>;
      noRuntime?: string;
      externalBindings?: Record<string, Record<string, unknown>>;
    }
  ): {
    code: string;
    css: string;
    map?: string | null;
    cacheObject: Record<string, string>;
    errors: string[];
    warnings: string[];
    staticExports: Record<string, unknown>;
  };
  extractImportSpecifiers(source: string): string[];
}

let binding: NativeBinding;

try {
  const require = createRequire(import.meta.url);
  binding = require('jsxstyle-swc-napi');
} catch (err) {
  throw new Error(
    '@jsxstyle/bundler-utils: SWC native binary not available for this platform ' +
      `(${process.platform}-${process.arch}).\n` +
      `Original error: ${err instanceof Error ? err.message : err}`
  );
}

/**
 * Extract non-jsxstyle import specifiers from source code using SWC's parser.
 *
 * Returns all import specifier strings except jsxstyle packages.
 * Handles relative imports, aliased paths (@/foo), and bare specifiers.
 */
export function extractImportSpecifiers(source: string): string[] {
  return binding.extractImportSpecifiers(source);
}

/**
 * Transform jsxstyle components in source code using the SWC backend.
 *
 * Class name generation happens entirely in Rust (no JS callback overhead).
 * Returns enriched result with cacheObject, errors, warnings, and staticExports.
 */
export function transform(
  source: string,
  filename: string,
  options: {
    classNameStrategy?: 'counter' | 'hash';
    classNamePrefix?: string;
    debugClassNames?: boolean;
    cacheObject?: Record<string, string>;
    noRuntime?: 'warn' | 'error';
    externalBindings?: Record<string, Record<string, unknown>>;
  } = {}
): PluginTransformResult {
  const result = binding.transform(source, filename, {
    classNameStrategy: options.classNameStrategy ?? 'hash',
    classNamePrefix: options.classNamePrefix ?? '_x',
    debugClassNames: options.debugClassNames,
    cacheObject: options.cacheObject,
    noRuntime: options.noRuntime,
    externalBindings: options.externalBindings,
  });

  // cssFileName computation stays in JS (matches original behavior)
  let cssFileName: string | null = null;
  if (result.css.length > 0) {
    const extName = path.extname(filename);
    const baseName = path.basename(filename, extName);
    const cssRelativeFileName = `./${baseName}__jsxstyle.css`;
    cssFileName = path.join(path.dirname(filename), cssRelativeFileName);
  }

  return {
    code: result.code,
    css: result.css,
    cssFileName,
    map: result.map ? JSON.parse(result.map) : null,
    cacheObject: result.cacheObject,
    errors: result.errors,
    warnings: result.warnings,
    staticExports: result.staticExports,
  };
}
