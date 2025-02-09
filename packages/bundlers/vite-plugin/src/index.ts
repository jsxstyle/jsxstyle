import fs from 'node:fs/promises';
import * as path from 'node:path';
import util from 'node:util';
import {
  type UserConfigurableOptions,
  extractStyles,
} from '@jsxstyle/bundler-utils';
import { getExportsFromModuleSource } from '@jsxstyle/bundler-utils';
import esbuild from 'esbuild';
import invariant from 'invariant';
import type { Plugin } from 'vite';

interface PluginOptions extends UserConfigurableOptions {
  staticModulePaths?: string[];
  extensions?: string[];
  cacheFile?: string;
  classNamePrefix?: string;
}

class ModuleBundler {
  constructor(
    private staticModulePaths: string[],
    private context: esbuild.BuildContext<{ write: false }>
  ) {}

  rebuildModules = async (): Promise<void> => {
    const result = await this.context.rebuild();
    this.modulesByAbsolutePath = result.outputFiles.reduce<
      Record<string, unknown>
    >((prev, file) => {
      const index = Number.parseInt(path.basename(file.path), 10);
      invariant(!Number.isNaN(index), 'Invalid file path: %s', file.path);
      const absPath = this.staticModulePaths[index];
      invariant(
        absPath,
        'File path `%s` does not have a corresponding static module path',
        file.path
      );
      const moduleExports = getExportsFromModuleSource(absPath, file.text);
      prev[absPath] = moduleExports;
      return prev;
    }, {});
  };

  modulesByAbsolutePath: Record<string, unknown> = {};

  cleanup = async () => {
    await this.context.dispose();
  };
}

export const jsxstyleVitePlugin = ({
  extensions = ['.ts', '.tsx', '.js'],
  cacheFile,
  classNamePrefix = '_x',
  staticModulePaths,
  ...options
}: PluginOptions = {}): Plugin => {
  const cssContent: Record<string, string> = {};
  const classNameCache: Record<string, string> = {};

  const getClassNameForKey = (() => {
    let num = 0;

    return (content: string) => {
      if (!classNameCache[content]) {
        classNameCache[content] = (num++).toString(36);
      }
      return classNamePrefix + classNameCache[content];
    };
  })();

  let moduleBundler: ModuleBundler | undefined;

  return {
    name: 'jsxstyle-vite-plugin',

    async handleHotUpdate(context) {
      if (
        staticModulePaths &&
        moduleBundler &&
        staticModulePaths.includes(context.file)
      ) {
        await moduleBundler.rebuildModules();
      }
    },

    async buildStart() {
      if (staticModulePaths) {
        const entryPoints = staticModulePaths.reduce<Record<string, string>>(
          (prev, modulePath, index) => {
            // ensure that rollup does something when our static modules change
            this.addWatchFile(modulePath);
            prev[`${index}`] = modulePath;
            return prev;
          },
          {}
        );
        try {
          const esbuildContext = await esbuild.context({
            target: 'node14',
            write: false,
            bundle: true,
            // code splitting will potentially add relative imports to in-memory files and we don't want that
            splitting: false,
            outdir: '/',
            // commonjs output lets us use `vm.runInContext`
            format: 'cjs',
            entryPoints,
          });

          moduleBundler = new ModuleBundler(staticModulePaths, esbuildContext);
        } catch (error) {
          this.error(error);
        }
      }

      if (cacheFile) {
        try {
          const cacheFileContents = await fs.readFile(cacheFile, {
            encoding: 'utf8',
            flag: 'r',
          });

          // create mapping of unique CSS strings to class names
          const lines = new Set<string>(cacheFileContents.trim().split('\n'));
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              // add each line of CSS to the cache
              getClassNameForKey(trimmedLine);
            }
          }
        } catch (error) {
          if (error.code === 'EISDIR') {
            throw new Error('Value of cacheFile is a directory');
          }

          if (error.code === 'ENOENT') {
            console.log('Cache file does not exist and will be created');
          } else {
            throw error;
          }
        }
      }
    },

    async buildEnd() {
      if (moduleBundler) await moduleBundler.cleanup();

      if (cacheFile) {
        try {
          const cacheString =
            Object.keys(classNameCache).filter(Boolean).join('\n') + '\n';
          await fs.writeFile(cacheFile, cacheString, 'utf8');
        } catch (error) {
          console.error(
            'Could not write cache file to `%s`:',
            cacheFile,
            error
          );
        }
      }
    },

    resolveId(id, importer) {
      if (!importer || !id.endsWith('__jsxstyle.css') || id.startsWith('\0'))
        return;
      const importerDirName = path.dirname(importer);
      const fullPath = path.join(importerDirName, id);
      return '\0' + fullPath;
    },

    async load(id) {
      if (id.endsWith('__jsxstyle.css')) {
        const idWithoutStuff = id.replace(/^\0/, '');
        const content = cssContent[idWithoutStuff];
        if (!content) {
          this.error('No CSS file could be found for ID ' + id);
        }
        return {
          code: content,
          moduleSideEffects: 'no-treeshake',
        };
      }

      // ignore modules that have already been resolved
      if (id.startsWith('\0')) return;

      if (!extensions.some((ext) => id.endsWith(ext))) return;

      const idWithoutStuff = id.replace(/^\0/, '');
      const fileContent = await fs.readFile(id, 'utf-8');
      const result = extractStyles(
        fileContent,
        idWithoutStuff,
        {
          warnCallback: (message: any, ...args: any[]) =>
            this.warn(util.format(message, ...args)),
          errorCallback: (message: any, ...args: any[]) =>
            this.error(util.format(message, ...args)),
          getClassNameForKey,
          modulesByAbsolutePath: moduleBundler?.modulesByAbsolutePath,
        },
        options
      );
      if (!result || !result.cssFileName) return;
      cssContent[result.cssFileName] = result.css;
      return {
        code: result.js.toString('utf-8'),
        ast: result.ast as any,
      };
    },

    async transform(fileContent, id) {
      if (staticModulePaths?.includes(id)) {
        return {
          code: fileContent,
          moduleSideEffects: 'no-treeshake',
        };
      }

      return;
    },
  };
};
