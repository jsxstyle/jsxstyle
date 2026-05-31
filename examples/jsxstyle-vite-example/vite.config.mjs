// @ts-check
import { jsxstyleVitePlugin } from '@jsxstyle/vite-plugin';
import reactPlugin from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    jsxstyleVitePlugin(),
    reactPlugin({
      jsxRuntime: 'automatic',
    }),
  ],
});
