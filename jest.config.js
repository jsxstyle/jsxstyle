module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  watchman: false,
  testMatch: [
    '<rootDir>/**/__tests__/*.spec.ts',
    '<rootDir>/**/__tests__/*.spec.tsx',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
