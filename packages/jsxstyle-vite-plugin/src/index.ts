import {
  extractStyles,
  type ExtractStylesOptions,
  type UserConfigurableOptions,
} from '../../jsxstyle-bundler-utils/src/ast/extractStyles';
import fs from 'fs/promises';
import path from 'path';
import type { Plugin } from 'vite';

interface PluginOptions
  extends UserConfigurableOptions,
    Pick<ExtractStylesOptions, 'modulesByAbsolutePath'> {
  extensions?: string[];
}

export const jsxstyleVitePlugin = ({
  extensions = ['.ts', '.tsx', '.js'],
  modulesByAbsolutePath,
  ...options
}: PluginOptions): Plugin => {
  const isHandledFile = (id: string) =>
    extensions.some((ext) => id.endsWith(ext));

  const cssContent: Record<string, string> = {};

  const getClassNameForKey = (() => {
    const cache: Record<string, string> = {};
    let num = 0;

    return (content: string) => {
      if (!cache[content]) {
        cache[content] = `_x${num++}`;
      }
      return cache[content];
    };
  })();

  return {
    name: 'jsxstyle-vite-plugin',
    resolveId(id, importer) {
      if (!importer || !id.endsWith('__jsxstyle.css')) return;
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
        };
      }

      if (!isHandledFile(id)) return;

      const fileContent = await fs.readFile(id, 'utf-8');
      const idWithoutStuff = id.replace(/^\0/, '');
      const result = extractStyles(
        fileContent,
        idWithoutStuff,
        {
          warnCallback: console.warn,
          errorCallback: console.error,
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
