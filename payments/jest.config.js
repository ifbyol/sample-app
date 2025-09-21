module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test files patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude main entry point
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.js'],

  // Module name mapping for better error messages
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Timeout for tests
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,


  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ]
};