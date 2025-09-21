// Global test setup
beforeAll(() => {
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
});

afterAll(() => {
  // Clean up any global resources
});

// Silence console.log/error during tests unless explicitly needed
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});