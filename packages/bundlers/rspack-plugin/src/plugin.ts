import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import { validateOptions } from '@jsxstyle/bundler-utils';
import type { PluginOptions } from '@jsxstyle/bundler-utils';
import type { Compiler, RspackPluginInstance } from '@rspack/core';

export interface PluginRegistryEntry {
  writeVirtualModule: (filePath: string, content: string) => void;
  cacheObject: Record<string, string>;
  pluginOptions: PluginOptions;
}

// Registry for sharing non-serializable data between plugin and loader.
// Uses globalThis to ensure a single registry across module instances
// (e.g., when Rspack loads compiled lib/loader.js while the plugin is imported from source).
const REGISTRY_KEY = '__jsxstyle_rspack_plugin_registry__';
const registry: Map<string, PluginRegistryEntry> =
  (globalThis as any)[REGISTRY_KEY] ?? new Map<string, PluginRegistryEntry>();
(globalThis as any)[REGISTRY_KEY] = registry;
const pluginRegistry = registry;

export interface JsxstyleRspackPluginOptions extends PluginOptions {
  /** Cache object for persistent class name mapping */
  cacheObject?: Record<string, string>;
}

// TODO(meyer) replace this with `import.meta.resolve` (node 20+) some time after node 18 is no longer LTS
const customRequire = createRequire(import.meta.url);

let instanceCounter = 0;

export class JsxstyleRspackPlugin implements RspackPluginInstance {
  private instanceId: string;
  private options: JsxstyleRspackPluginOptions;
  private cacheObject: Record<string, string>;

  constructor(options: JsxstyleRspackPluginOptions = {}) {
    const { cacheObject, ...pluginOptions } = options;

    // Validate shared plugin options (extensions, classNameStrategy, etc.)
    validateOptions(
      'jsxstyle-rspack-plugin',
      pluginOptions as Record<string, unknown>
    );
    this.instanceId = `jsxstyle-rspack-${instanceCounter++}`;
    this.options = options;
    this.cacheObject = cacheObject ?? {};

    // Load cache file if specified
    if (options.cacheFile) {
      try {
        const contents = fs.readFileSync(options.cacheFile, 'utf8');
        for (const line of contents.trim().split('\n')) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            this.cacheObject[trimmedLine] = this.cacheObject[trimmedLine] || '';
          }
        }
      } catch {
        // Cache file doesn't exist yet, that's fine
      }
    }
  }

  static loader: string = customRequire.resolve(
    '@jsxstyle/rspack-plugin/loader'
  );

  apply(compiler: Compiler) {
    // Default debugClassNames to true in development mode
    if (this.options.debugClassNames === undefined) {
      this.options = {
        ...this.options,
        debugClassNames: compiler.options.mode === 'development',
      };
    }

    const { experiments } = customRequire(
      '@rspack/core'
    ) as typeof import('@rspack/core');
    const virtualModules = new experiments.VirtualModulesPlugin({});
    virtualModules.apply(compiler);

    const {
      extensions = ['.ts', '.tsx', '.js', '.jsx'],
      cacheObject: _cacheObject,
      ...pluginOptions
    } = this.options;

    // Register plugin instance for loader access
    pluginRegistry.set(this.instanceId, {
      writeVirtualModule: (filePath, content) =>
        virtualModules.writeModule(filePath, content),
      cacheObject: this.cacheObject,
      pluginOptions,
    });

    // Add loader rule
    compiler.options.module.rules.push({
      test: new RegExp(
        `\\.(?:${extensions.map((e) => e.replace('.', '')).join('|')})$`
      ),
      use: [
        {
          loader: JsxstyleRspackPlugin.loader,
          options: { pluginInstanceId: this.instanceId },
        },
      ],
    });

    // Clean up registry when compiler closes
    compiler.hooks.shutdown.tap('JsxstyleRspackPlugin', () => {
      pluginRegistry.delete(this.instanceId);
    });

    // Write cache file on build completion if specified
    if (this.options.cacheFile) {
      compiler.hooks.done.tap('JsxstyleRspackPlugin', () => {
        try {
          const cacheString =
            Object.keys(this.cacheObject).filter(Boolean).join('\n') + '\n';
          // oxlint-disable-next-line typescript/no-non-null-assertion -- cacheFile is checked before this hook is registered
          fs.writeFileSync(this.options.cacheFile!, cacheString, 'utf8');
        } catch {
          // Failed to write cache file
        }
      });
    }
  }
}

export { pluginRegistry };
