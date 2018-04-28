'use strict';
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },

  root: true,

  extends: ['eslint:recommended', 'plugin:react/recommended'],

  plugins: ['react'],

  parser: 'babel-eslint',

  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },

  rules: {
    strict: 0,
    'no-console': [2, { allow: ['error'] }],
    'no-var': 2,
    'prefer-const': 2,
    'object-shorthand': 2,
    'no-use-before-define': 2,
    'react/prop-types': [1, { ignore: ['children'] }],
  },

  overrides: [
    {
      files: ['examples/jsxstyle-preact-*/src/**/*.js'],
      settings: {
        react: {
          pragma: 'h',
        },
      },
      globals: {
        // preact-cli uses a babel plugin that auto-prepends the `h` import
        // https://github.com/smyte/jsxstyle/issues/98#issuecomment-359232836
        h: true,
      },
    },
    {
      files: ['*.amd.js', '*.cjs.js', '*.es.js'],
      rules: {
        'no-var': 0,
        'prefer-const': 0,
        'object-shorthand': 0,
      },
    },
    {
      files: ['*.amd.js', '*.cjs.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};
