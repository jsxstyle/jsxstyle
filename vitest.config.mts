import react from '@vitejs/plugin-react';
import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  // plugins: [react()],
  test: {
    include: ['**/__tests__/*.spec.ts', '**/__tests__/*.spec.tsx'],
    exclude: [...defaultExclude, 'examples/jsxstyle-astro-example/__tests__'],
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
