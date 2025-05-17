// @ts-check

import { defineConfig } from '@rslib/core';
import { pluginDts } from 'rsbuild-plugin-dts';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
    },
  ],
  output: {
    target: 'web',
    cleanDistPath: true,
    distPath: {
      root: 'lib',
    },
  },
  plugins: [pluginDts()],
});
