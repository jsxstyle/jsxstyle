import * as path from 'node:path';
import reactPlugin from '@vitejs/plugin-react';
import { jsxstyleVitePlugin } from 'jsxstyle/experimental/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    reactPlugin(),
    jsxstyleVitePlugin({
      staticModulePaths: [path.resolve(process.cwd(), 'src/styleConstants.ts')],
    }),
  ],
});
