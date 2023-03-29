// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/jsx-runtime',
    'plugin:react/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          'tsconfig.test.json',
          'minisite/tsconfig.json',
          'packages/jsxstyle-react/tsconfig.json',
          'packages/jsxstyle-solid/tsconfig.json',
          'packages/jsxstyle-utils/tsconfig.json',
          'packages/jsxstyle-nextjs-plugin/tsconfig.json',
          'packages/jsxstyle-webpack-plugin/tsconfig.json',
          'examples/jsxstyle-typescript-example/tsconfig.json',
        ],
      },
      extends: ['plugin:@typescript-eslint/recommended'],
    },
    {
      files: ['**/*.spec.ts', '**/*.spec.tsx'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
    {
      files: ['minisite/**/*.ts', 'minisite/**/*.tsx'],
      plugins: ['@next/eslint-plugin-next'],
      extends: ['plugin:@next/next/recommended'],
      settings: {
        next: {
          rootDir: 'minisite',
        },
      },
    },
  ],
};
