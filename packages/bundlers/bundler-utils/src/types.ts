import type { Volume } from 'memfs';

export type MemoryFS = InstanceType<typeof Volume>;

/** Shared options for all bundler plugins (Vite, webpack, Rspack, Next.js). */
export interface PluginOptions {
  /** File extensions to transform (default: ['.ts', '.tsx', '.js']) */
  extensions?: string[];
  /** Class name strategy: 'counter' for sequential, 'hash' for content-based */
  classNameStrategy?: 'counter' | 'hash';
  /** Prefix for generated class names (default: '_x') */
  classNamePrefix?: string;
  /** Enable debug class names in dev mode */
  debugClassNames?: boolean;
  /** Control unextractable runtime props: "warn" or "error" */
  noRuntime?: 'warn' | 'error';
  /** Path to cache file for persistent class name mapping */
  cacheFile?: string;
}

/** Result from the SWC transform API. */
export interface PluginTransformResult {
  /** Transformed JavaScript source code */
  code: string;
  /** Extracted CSS rules */
  css: string;
  /** Path for the CSS sidecar file, or null if no CSS extracted */
  cssFileName: string | null;
  /** Source map (raw object or JSON), or null */
  map: any;
  /** Cache object containing style key -> class name mappings */
  cacheObject: Record<string, string>;
  /** Error messages collected during the transform */
  errors: string[];
  /** Warning messages collected during the transform */
  warnings: string[];
  /** Static exports detected in this module (export name -> JSON value) */
  staticExports: Record<string, unknown>;
}
