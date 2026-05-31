// @ts-check

import node from '@astrojs/node';
import react from '@astrojs/react';
import { jsxstyle } from '@jsxstyle/astro/integration';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), jsxstyle({ classNamePrefix: '_j' })],

  build: {
    assets: '-',
  },

  vite: {
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },

    build: {
      rollupOptions: {
        output: {
          assetFileNames: '-/[hash][extname]',
        },
      },
    },
  },
});
