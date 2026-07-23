import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/__tests__/*.spec.ts', '**/__tests__/*.spec.tsx'],
    exclude: [
      ...defaultExclude,
      '**/.claude/**',
      'examples/jsxstyle-astro-example/__tests__',
    ],
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
