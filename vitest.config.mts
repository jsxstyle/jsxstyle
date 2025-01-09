import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/__tests__/*.spec.ts', '**/__tests__/*.spec.tsx'],
    exclude: [...defaultExclude, 'demo-app/__tests__/example.spec.ts'],
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
