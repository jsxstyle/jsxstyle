'use strict';

module.exports = {
  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 6,
  },
  extends: ['plugin:jest/recommended'],
  env: {
    'jest/globals': true,
  },
  plugins: ['jest'],
};
