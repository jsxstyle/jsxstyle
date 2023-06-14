import { defineConfig } from 'vite';
import { jsxstyleVitePlugin } from 'jsxstyle/experimental/vite-plugin';
import path from 'path';
import * as styleConstants from './src/styleConstants';
import reactPlugin from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    reactPlugin(),
    jsxstyleVitePlugin({
      modulesByAbsolutePath: {
        [path.resolve(process.cwd(), 'src/styleConstants.ts')]: styleConstants,
      },
    }),
  ],
});
