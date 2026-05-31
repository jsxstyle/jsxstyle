const VALID_OPTIONS = new Set([
  'extensions',
  'classNamePrefix',
  'classNameStrategy',
  'debugClassNames',
  'noRuntime',
  'cacheFile',
]);

/**
 * Validate plugin options against the shared PluginOptions shape.
 *
 * Throws on unknown keys, wrong types, or deprecated boolean noRuntime.
 *
 * @param pluginName - Plugin name for error message prefix (e.g., "jsxstyle-vite-plugin")
 * @param options - The options object to validate
 */
export function validateOptions(
  pluginName: string,
  options: Record<string, unknown>
): void {
  for (const key of Object.keys(options)) {
    if (!VALID_OPTIONS.has(key)) {
      throw new Error(
        `${pluginName}: unknown option "${key}". ` +
          `Valid options: ${[...VALID_OPTIONS].sort().join(', ')}`
      );
    }
  }
  if ('noRuntime' in options) {
    const val = options.noRuntime;
    if (val === true || val === false) {
      throw new Error(
        `${pluginName}: noRuntime no longer accepts boolean values. ` +
          'Use "error" or "warn" instead.'
      );
    }
    if (val !== undefined && val !== 'warn' && val !== 'error') {
      throw new Error(`${pluginName}: noRuntime must be "warn" or "error"`);
    }
  }
  if ('classNameStrategy' in options) {
    const val = options.classNameStrategy;
    if (val !== undefined && val !== 'counter' && val !== 'hash') {
      throw new Error(
        `${pluginName}: classNameStrategy must be "counter" or "hash"`
      );
    }
  }
  if ('extensions' in options && options.extensions !== undefined) {
    if (!Array.isArray(options.extensions)) {
      throw new Error(`${pluginName}: extensions must be an array of strings`);
    }
  }
  if ('debugClassNames' in options && options.debugClassNames !== undefined) {
    if (typeof options.debugClassNames !== 'boolean') {
      throw new Error(`${pluginName}: debugClassNames must be a boolean`);
    }
  }
  if ('classNamePrefix' in options && options.classNamePrefix !== undefined) {
    if (typeof options.classNamePrefix !== 'string') {
      throw new Error(`${pluginName}: classNamePrefix must be a string`);
    }
  }
  if ('cacheFile' in options && options.cacheFile !== undefined) {
    if (typeof options.cacheFile !== 'string') {
      throw new Error(`${pluginName}: cacheFile must be a string`);
    }
  }
}
