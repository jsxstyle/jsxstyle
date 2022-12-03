module.exports = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  watchman: false,
  testMatch: [
    '<rootDir>/**/__tests__/*.spec.ts',
    '<rootDir>/**/__tests__/*.spec.tsx',
  ],
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
