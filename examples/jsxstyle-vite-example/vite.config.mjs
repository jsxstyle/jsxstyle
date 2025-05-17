// @ts-check

import * as path from 'node:path';
import { jsxstyleVitePlugin } from '@jsxstyle/vite-plugin';
import reactPlugin from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    reactPlugin({
      jsxRuntime: 'automatic',
    }),
    jsxstyleVitePlugin({
      staticModulePaths: [path.resolve(process.cwd(), 'src/styleConstants.ts')],
    }),
  ],
});
