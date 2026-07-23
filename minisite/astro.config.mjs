// @ts-check

import * as path from 'node:path';
import react from '@astrojs/react';
import { jsxstyle } from '@jsxstyle/astro/integration';
import { defineConfig } from 'astro/config';

const __dirname = new URL('.', import.meta.url).pathname;

/** @returns {NonNullable<NonNullable<import('astro').AstroUserConfig['vite']>['plugins']>[number]} */
const browserNodePolyfills = () => {
  /** @type {Record<string, string>} */
  const polyfills = {
    'node:path': path.resolve(__dirname, './src/polyfills/path.ts'),
    'node:vm': path.resolve(__dirname, './src/polyfills/vm.ts'),
  };
  return {
    name: 'jsxstyle-minisite:browser-node-polyfills',
    enforce: 'pre',
    resolveId(id) {
      if (this.environment?.name === 'client' && id in polyfills) {
        return polyfills[id];
      }
      return null;
    },
  };
};

/** @type {Record<string, [string, string]>} */
const inject = {
  process: [path.resolve(__dirname, './src/polyfills/process.ts'), '*'],
};

export default defineConfig({
  integrations: [react(), jsxstyle({ classNamePrefix: '_j' })],

  build: {
    assets: '-',
  },

  vite: {
    plugins: [browserNodePolyfills()],

    optimizeDeps: {
      rolldownOptions: {
        transform: { inject },
      },
    },

    build: {
      rolldownOptions: {
        output: {
          assetFileNames: '-/[hash][extname]',
        },

        transform: { inject },
      },
    },
  },
});
