import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DependencyAnalysisCache,
  extractImportSpecifiers,
  transform as swcTransform,
  validateOptions,
} from '@jsxstyle/bundler-utils';
import type { PluginOptions } from '@jsxstyle/bundler-utils';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

const JSXSTYLE_IMPORT_RE = /['"]@jsxstyle\//;

export const jsxstyleVitePlugin = (options: PluginOptions = {}): Plugin => {
  validateOptions('jsxstyle-vite-plugin', options as Record<string, unknown>);
  const {
    extensions = ['.ts', '.tsx', '.js'],
    classNamePrefix = '_x',
    classNameStrategy = 'counter',
    debugClassNames,
    noRuntime,
  } = options;
  const cssContent: Record<string, string> = {};
  const fileToCssMap: Record<string, string> = {};
  let resolvedConfig: ResolvedConfig;
  let server: ViteDevServer | undefined;

  // Shared cache object across all transform calls for consistent class names
  const cacheObject: Record<string, string> = {};

  // Cache for dependency analysis (static export detection)
  const depCache = new DependencyAnalysisCache();

  return {
    name: 'jsxstyle-vite-plugin',
    enforce: 'pre',

    configResolved(config) {
      resolvedConfig = config;
    },

    configureServer(devServer) {
      server = devServer;
    },

    resolveId(id, importer) {
      if (!importer || !id.endsWith('__jsxstyle.css') || id.startsWith('\0'))
        return;
      const importerDirName = path.dirname(importer);
      const fullPath = path.join(importerDirName, id);
      return '\0' + fullPath;
    },

    load(id) {
      if (!id.startsWith('\0') || !id.endsWith('__jsxstyle.css')) return;
      const content = cssContent[id.slice(1)];
      if (!content) {
        this.error('No CSS content found for virtual module: ' + id);
      }
      return {
        code: content,
        moduleSideEffects: 'no-treeshake',
      };
    },

    async transform(code, id) {
      const cleanId = id.replace(/\?.*$/, '');
      if (!extensions.some((ext: string) => cleanId.endsWith(ext))) return;
      if (cleanId.startsWith('\0')) return;

      // Clean up previous CSS entry for this file (handles HMR when jsxstyle components are removed)
      const prevCss = fileToCssMap[cleanId];
      if (prevCss) {
        delete cssContent[prevCss];
        delete fileToCssMap[cleanId];
      }

      // Use the new NAPI API: class names generated in Rust, diagnostics returned as data
      const isDebug =
        debugClassNames !== undefined
          ? debugClassNames
          : resolvedConfig.command === 'serve';

      const transformOptions = {
        classNameStrategy,
        classNamePrefix,
        debugClassNames: isDebug,
        cacheObject,
        noRuntime,
      };

      // Analyze dependencies for external bindings when this file imports from jsxstyle
      let externalBindings: Record<string, Record<string, unknown>> | undefined;
      if (JSXSTYLE_IMPORT_RE.test(code)) {
        const specifiers = extractImportSpecifiers(code);
        if (specifiers.length > 0) {
          externalBindings = {};
          for (const specifier of specifiers) {
            try {
              const resolved = await this.resolve(specifier, cleanId);
              if (!resolved || resolved.external) continue;
              const resolvedPath = resolved.id;
              const depSource = fs.readFileSync(resolvedPath, 'utf8');
              const staticExports = depCache.analyze(
                resolvedPath,
                depSource,
                transformOptions
              );
              if (Object.keys(staticExports).length > 0) {
                externalBindings[specifier] = staticExports;
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

      const result = swcTransform(code, cleanId, {
        ...transformOptions,
        externalBindings,
      });

      // Merge returned cache back into our shared cache
      Object.assign(cacheObject, result.cacheObject);

      // Route warnings through Vite's warning system
      for (const warning of result.warnings) {
        this.warn(warning);
      }

      // Route errors through Vite's error system
      if (result.errors.length > 0) {
        if (noRuntime === 'error') {
          // Accumulate all errors and report at once (Vite's this.error() throws immediately)
          this.error(result.errors.join('\n'));
        } else {
          for (const error of result.errors) {
            this.error(error);
          }
        }
      }

      if (!result.cssFileName) {
        return { code: result.code, map: result.map };
      }

      cssContent[result.cssFileName] = result.css;
      fileToCssMap[cleanId] = result.cssFileName;

      // During HMR, reload the CSS virtual module so the browser picks up
      // updated styles. This must happen here (in transform) rather than in
      // handleHotUpdate, because handleHotUpdate fires BEFORE transform,
      // meaning load() would read stale cssContent.
      if (prevCss && server) {
        const virtualId = '\0' + result.cssFileName;
        const cssModule = server.moduleGraph.getModuleById(virtualId);
        if (cssModule) {
          server.moduleGraph.invalidateModule(cssModule);
          server.reloadModule(cssModule).catch(() => {});
        }
      }

      const cssImport = `import ${JSON.stringify('./' + path.basename(result.cssFileName))};\n`;
      return {
        code: cssImport + result.code,
        map: result.map,
      };
    },
  };
};
