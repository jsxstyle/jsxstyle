// @ts-check

import * as path from 'node:path';
import injectPlugin from '@rollup/plugin-inject';
import { defineConfig } from 'vite';

export default defineConfig((env) => ({
  resolve: {
    alias: ['path', 'vm'].map((moduleName) => ({
      find: moduleName,
      replacement: path.resolve(__dirname, `./src/polyfills/${moduleName}.ts`),
    })),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      inject:
        // this work is more comprehensively at build time by @rollup/plugin-inject
        env.command === 'serve' ? ['./src/polyfills/shims.ts'] : undefined,
    },
  },
  build: {
    rollupOptions: {
      input: [
        path.resolve(__dirname, 'index.html'),
        path.resolve(__dirname, '404.html'),
        path.resolve(__dirname, 'code-preview.html'),
      ],
      plugins: [
        injectPlugin({
          // a namespace import gives us nice error messages if we missed an export
          Buffer: [path.resolve(__dirname, './src/polyfills/buffer.ts'), '*'],
          process: [path.resolve(__dirname, './src/polyfills/process.ts'), '*'],
          // monaco-editor has guards in place for process.* usage
          exclude: /\/monaco-editor\//,
        }),
      ],
    },
  },
}));
