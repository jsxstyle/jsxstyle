import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/__tests__/*.spec.ts', '**/__tests__/*.spec.tsx'],
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
