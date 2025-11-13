import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to use the theme context
const TestComponent = () => {
  const { theme, toggleTheme, switchable } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="switchable">{switchable.toString()}</div>
      {toggleTheme && (
        <button onClick={toggleTheme} data-testid="toggle-theme">
          Toggle Theme
        </button>
      )}
    </div>
  );
};

describe("ThemeContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document classes
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove("dark");
  });

  describe("ThemeProvider", () => {
    it("provides default light theme", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
      expect(screen.getByTestId("switchable")).toHaveTextContent("false");
    });

    it("provides custom default theme", () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    });

    it("applies dark class to document when theme is dark", () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes dark class when theme is light", () => {
      // First set dark theme
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Then switch to light theme
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("Switchable theme", () => {
    it("enables theme switching when switchable is true", () => {
      render(
        <ThemeProvider switchable>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("switchable")).toHaveTextContent("true");
      expect(screen.getByTestId("toggle-theme")).toBeInTheDocument();
    });

    it("does not show toggle button when switchable is false", () => {
      render(
        <ThemeProvider switchable={false}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("switchable")).toHaveTextContent("false");
      expect(screen.queryByTestId("toggle-theme")).not.toBeInTheDocument();
    });

    it("toggles theme when toggle button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider switchable defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light");

      const toggleButton = screen.getByTestId("toggle-theme");
      await user.click(toggleButton);

      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");

      await user.click(toggleButton);

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    });

    it("updates document class when toggling theme", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider switchable defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(false);

      const toggleButton = screen.getByTestId("toggle-theme");
      await user.click(toggleButton);

      expect(document.documentElement.classList.contains("dark")).toBe(true);

      await user.click(toggleButton);

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("localStorage integration", () => {
    it("reads theme from localStorage when switchable", () => {
      localStorageMock.getItem.mockReturnValue("dark");

      render(
        <ThemeProvider switchable>
          <TestComponent />
        </ThemeProvider>
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith("theme");
      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    });

    it("uses default theme when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider switchable defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    });

    it("saves theme to localStorage when switchable", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider switchable>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId("toggle-theme");
      await user.click(toggleButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    it("does not use localStorage when not switchable", () => {
      render(
        <ThemeProvider switchable={false}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(localStorageMock.getItem).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe("useTheme hook", () => {
    it("throws error when used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useTheme must be used within ThemeProvider");

      consoleSpy.mockRestore();
    });

    it("returns theme context when used within provider", () => {
      render(
        <ThemeProvider defaultTheme="dark" switchable>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("switchable")).toHaveTextContent("true");
      expect(screen.getByTestId("toggle-theme")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles invalid localStorage values", () => {
      localStorageMock.getItem.mockReturnValue("invalid-theme");

      render(
        <ThemeProvider switchable defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      // Should fall back to default theme
      expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    });

    it("handles localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // The component should still render with default theme
      render(
        <ThemeProvider switchable defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    });

    it("handles multiple theme changes rapidly", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider switchable>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId("toggle-theme");

      // Rapid clicks
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);

      expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("Multiple providers", () => {
    it("handles nested providers correctly", () => {
      const NestedComponent = () => {
        const { theme } = useTheme();
        return <div data-testid="nested-theme">{theme}</div>;
      };

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeProvider defaultTheme="dark">
            <NestedComponent />
          </ThemeProvider>
        </ThemeProvider>
      );

      // Inner provider should take precedence
      expect(screen.getByTestId("nested-theme")).toHaveTextContent("dark");
    });
  });
});
