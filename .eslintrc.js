'use strict';
module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true,
  },

  extends: ['eslint:recommended', 'plugin:react/recommended'],

  plugins: ['react'],

  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 6,
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },

  settings: {
    react: {
      version: '15',
    },
  },

  rules: {
    strict: [2, 'global'],
    'no-console': [
      2,
      {
        allow: ['error', 'info', 'warn', 'group', 'groupCollapsed', 'groupEnd'],
      },
    ],
    'no-var': 2,
    'no-unused-vars': 2,
    'prefer-const': 2,
    'object-shorthand': 2,

    // Errors
    'react/display-name': 2,
    'react/jsx-no-duplicate-props': 2,
    'react/jsx-no-undef': 2,
    'react/jsx-uses-react': 2,
    'react/jsx-uses-vars': 2,
    'react/no-deprecated': 2,
    'react/no-did-update-set-state': 2,
    'react/no-direct-mutation-state': 2,
    'react/no-is-mounted': 2,
    'react/react-in-jsx-scope': 2,

    // Warnings (displayed as advice)
    'react/no-did-mount-set-state': 1,
    'react/prop-types': 1,
    'react/no-danger': 1,
  },
};
