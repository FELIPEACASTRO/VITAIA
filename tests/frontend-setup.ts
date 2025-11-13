import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

// Extend Vitest matchers with jest-dom and jest-axe
expect.extend(toHaveNoViolations);

declare global {
  namespace Vi {
    interface JestAssertion<T = any>
      extends jest.Matchers<void, T>,
        jest.Matchers<Promise<void>, T> {}
  }
}

// Frontend test environment setup
beforeAll(async () => {
  // Mock environment variables for frontend tests
  process.env.NODE_ENV = "test";

  // Mock window.matchMedia for tests
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  console.log("🎭 Frontend test environment initialized");
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

afterAll(async () => {
  console.log("🎭 Frontend test cleanup completed");
});
