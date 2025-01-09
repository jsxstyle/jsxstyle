// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import { jsxstyle } from '@jsxstyle/astro/integration';

export default defineConfig({
  integrations: [
    jsxstyle(),
    react({ include: ['src/components/ReactExample.tsx'] }),
    preact({ include: ['src/components/PreactExample.tsx'] }),
    solid({ include: ['src/components/SolidExample.tsx'] }),
  ],
});
