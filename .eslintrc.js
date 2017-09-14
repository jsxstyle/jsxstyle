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
      files: ['*.cjs.js', '*.es.js'],
      rules: {
        'no-var': 0,
        'prefer-const': 0,
        'object-shorthand': 0,
      },
    },
    {
      files: ['*.cjs.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};
