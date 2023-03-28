// @ts-check

/** @type {import('@jest/types').Config.DefaultOptions} */
module.exports = {
  watchman: false,
  testMatch: ['**/__tests__/*.spec.ts', '**/__tests__/*.spec.tsx'],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
