export default {
  displayName: 'web-api',
  preset: './jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  /** Prisma 7 generated client is ESM-oriented (`import.meta`); stub in unit tests */
  moduleNameMapper: {
    '^\\.\\./(\\.\\./)*generated/prisma/client$':
      '<rootDir>/src/test/mocks/prisma-generated-client.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage/web-api',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)',
  ],
};
