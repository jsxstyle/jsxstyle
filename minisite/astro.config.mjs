// @ts-check

import * as path from 'node:path';
import react from '@astrojs/react';
import { jsxstyle } from '@jsxstyle/astro/integration';
import injectPlugin from '@rollup/plugin-inject';
import { defineConfig } from 'astro/config';

const __dirname = new URL('.', import.meta.url).pathname;

// https://astro.build/config
export default defineConfig({
  integrations: [react(), jsxstyle({ classNamePrefix: '_j' })],

  build: {
    assets: '-',
  },

  vite: {
    resolve: {
      alias: ['path', 'vm'].map((moduleName) => ({
        find: 'node:' + moduleName,
        replacement: path.resolve(
          __dirname,
          `./src/polyfills/${moduleName}.ts`
        ),
      })),
    },

    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        inject:
          // this work is more comprehensively at build time by @rollup/plugin-inject
          ['./src/polyfills/shims.ts'],
      },
    },

    build: {
      rollupOptions: {
        output: {
          assetFileNames: '-/[hash][extname]',
        },

        plugins: [
          /** @type {any} */
          (
            injectPlugin({
              // a namespace import gives us nice error messages if we missed an export
              // Buffer: [
              //   path.resolve(__dirname, './src/polyfills/buffer.ts'),
              //   '*',
              // ],
              process: [
                path.resolve(__dirname, './src/polyfills/process.ts'),
                '*',
              ],
              // monaco-editor has guards in place for process.* usage
              exclude: /\/monaco-editor\//,
            })
          ),
        ],
      },
    },
  },
});
