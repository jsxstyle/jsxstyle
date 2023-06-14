import {
  extractStyles,
  type ExtractStylesOptions,
  type UserConfigurableOptions,
} from '../../jsxstyle-bundler-utils/src/ast/extractStyles';
import fs from 'fs/promises';
import util from 'util';
import path from 'path';
import type { Plugin } from 'vite';

interface PluginOptions
  extends UserConfigurableOptions,
    Partial<Pick<ExtractStylesOptions, 'modulesByAbsolutePath'>> {
  extensions?: string[];
  cacheFile?: string;
  classNamePrefix?: string;
}

export const jsxstyleVitePlugin = ({
  extensions = ['.ts', '.tsx', '.js'],
  cacheFile,
  classNamePrefix = '_x',
  modulesByAbsolutePath,
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

  let buildStart: Plugin['buildStart'];
  let buildEnd: Plugin['buildEnd'];

  if (typeof cacheFile === 'string') {
    buildStart = async () => {
      try {
        const cacheFileContents = await fs.readFile(cacheFile, {
          encoding: 'utf8',
          flag: 'r',
        });

        // create mapping of unique CSS strings to class names
        const lines = new Set<string>(cacheFileContents.trim().split('\n'));
        lines.forEach((line) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            // add each line of CSS to the cache
            getClassNameForKey(trimmedLine);
          }
        });
      } catch (error) {
        if (error.code === 'EISDIR') {
          throw new Error('Value of cacheFile is a directory');
        } else if (error.code === 'ENOENT') {
          console.log('Cache file does not exist and will be created');
        } else {
          throw error;
        }
      }
    };

    buildEnd = async () => {
      try {
        const cacheString =
          Object.keys(classNameCache).filter(Boolean).join('\n') + '\n';
        await fs.writeFile(cacheFile, cacheString, 'utf8');
      } catch (error) {
        console.error('Could not write cache file to `%s`:', cacheFile, error);
      }
    };
  }

  return {
    name: 'jsxstyle-vite-plugin',
    buildStart,
    buildEnd,

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
      return;
    },

    async transform(fileContent, id) {
      if (modulesByAbsolutePath && id in modulesByAbsolutePath) {
        return {
          code: fileContent,
          moduleSideEffects: 'no-treeshake',
        };
      }

      if (!extensions.some((ext) => id.endsWith(ext))) return;

      const idWithoutStuff = id.replace(/^\0/, '');
      const result = extractStyles(
        fileContent,
        idWithoutStuff,
        {
          warnCallback: (message, ...args) =>
            this.warn(util.format(message, ...args)),
          errorCallback: (message, ...args) =>
            this.error(util.format(message, ...args)),
          getClassNameForKey,
          modulesByAbsolutePath,
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
  };
};
