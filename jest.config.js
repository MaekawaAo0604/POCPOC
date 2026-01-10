const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^nanoid$': '<rootDir>/lib/utils/__mocks__/nanoid.ts',
  },
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
};

module.exports = createJestConfig(customJestConfig);
