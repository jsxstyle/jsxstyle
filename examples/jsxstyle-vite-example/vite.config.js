import { defineConfig } from 'vite';
import { jsxstyleVitePlugin } from 'jsxstyle/experimental/vite-plugin';
import path from 'path';
import reactPlugin from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    reactPlugin(),
    jsxstyleVitePlugin({
      staticModulePaths: [path.resolve(process.cwd(), 'src/styleConstants.ts')],
    }),
  ],
});
