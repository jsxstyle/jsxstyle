import type { RequestStyleCacheOptions } from '@jsxstyle/core';
import type { AstroIntegration } from 'astro';

export type JsxstyleIntegrationOptions = RequestStyleCacheOptions;

const VIRTUAL_MODULE_ID = 'virtual:jsxstyle/config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export const jsxstyle = (
  options: JsxstyleIntegrationOptions = {}
): AstroIntegration => ({
  name: 'jsxstyle',
  hooks: {
    'astro:config:setup': ({ addMiddleware, updateConfig }) => {
      // Provide options to middleware via virtual module
      updateConfig({
        vite: {
          plugins: [
            {
              name: 'jsxstyle-config',
              resolveId(id) {
                if (id === VIRTUAL_MODULE_ID) {
                  return RESOLVED_VIRTUAL_MODULE_ID;
                }
                return;
              },
              load(id) {
                if (id === RESOLVED_VIRTUAL_MODULE_ID) {
                  return `export default ${JSON.stringify(options)};`;
                }
                return;
              },
            },
          ],
        },
      });

      addMiddleware({
        entrypoint: new URL('./middleware.ts', import.meta.url),
        order: 'pre',
      });
    },
  },
});
