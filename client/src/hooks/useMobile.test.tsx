import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIsMobile } from "./useMobile";

// Mock window.matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];

  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(
      (event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (event === "change") {
          listeners.push(listener);
        }
      }
    ),
    removeEventListener: vi.fn(
      (event: string, listener: (event: MediaQueryListEvent) => void) => {
        if (event === "change") {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      }
    ),
    dispatchEvent: vi.fn(),
    // Helper to trigger change events in tests
    _triggerChange: (newMatches: boolean) => {
      listeners.forEach(listener => {
        listener({ matches: newMatches } as MediaQueryListEvent);
      });
    },
  }));
};

describe("useIsMobile", () => {
  let originalInnerWidth: number;
  let matchMediaMock: any;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;

    // Create and set up matchMedia mock
    matchMediaMock = createMatchMediaMock(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: originalInnerWidth,
    });

    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("returns false for desktop screen size", () => {
      // Set desktop width
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it("returns true for mobile screen size", () => {
      // Set mobile width
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("returns true for tablet screen size (below 768px)", () => {
      // Set tablet width (just below breakpoint)
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("returns false for screen size at breakpoint (768px)", () => {
      // Set width exactly at breakpoint
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe("Media Query Setup", () => {
    it("sets up media query listener correctly", () => {
      renderHook(() => useIsMobile());

      expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)");
    });

    it("adds event listener for media query changes", () => {
      const { result } = renderHook(() => useIsMobile());
      const mediaQueryList = matchMediaMock.mock.results[0].value;

      expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });
  });

  describe("Responsive Behavior", () => {
    it("updates when screen size changes from desktop to mobile", () => {
      // Start with desktop
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate screen size change to mobile
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          value: 375,
        });

        // Trigger the media query change event
        const mediaQueryList = matchMediaMock.mock.results[0].value;
        mediaQueryList._triggerChange(true);
      });

      expect(result.current).toBe(true);
    });

    it("updates when screen size changes from mobile to desktop", () => {
      // Start with mobile
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Simulate screen size change to desktop
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          value: 1024,
        });

        // Trigger the media query change event
        const mediaQueryList = matchMediaMock.mock.results[0].value;
        mediaQueryList._triggerChange(false);
      });

      expect(result.current).toBe(false);
    });

    it("handles multiple screen size changes", () => {
      // Start with desktop
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      const mediaQueryList = matchMediaMock.mock.results[0].value;

      // Change to mobile
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          value: 375,
        });
        mediaQueryList._triggerChange(true);
      });
      expect(result.current).toBe(true);

      // Change back to desktop
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          value: 1200,
        });
        mediaQueryList._triggerChange(false);
      });
      expect(result.current).toBe(false);

      // Change to tablet
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          value: 600,
        });
        mediaQueryList._triggerChange(true);
      });
      expect(result.current).toBe(true);
    });
  });

  describe("Cleanup", () => {
    it("removes event listener on unmount", () => {
      const { unmount } = renderHook(() => useIsMobile());
      const mediaQueryList = matchMediaMock.mock.results[0].value;

      unmount();

      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("does not cause memory leaks with multiple mounts/unmounts", () => {
      // Mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(() => useIsMobile());
        unmount();
      }

      // Each mount should have created a media query
      expect(matchMediaMock).toHaveBeenCalledTimes(5);

      // Each unmount should have removed the event listener
      const allResults = matchMediaMock.mock.results;
      allResults.forEach(result => {
        expect(result.value.removeEventListener).toHaveBeenCalledWith(
          "change",
          expect.any(Function)
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles breakpoint boundary correctly", () => {
      // Test exactly at breakpoint - 1 (should be mobile)
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 767,
      });

      const { result: result767 } = renderHook(() => useIsMobile());
      expect(result767.current).toBe(true);

      // Test exactly at breakpoint (should be desktop)
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 768,
      });

      const { result: result768 } = renderHook(() => useIsMobile());
      expect(result768.current).toBe(false);
    });

    it("handles very small screen sizes", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 320, // iPhone 5 width
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it("handles very large screen sizes", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 2560, // 4K monitor width
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it("returns boolean even with undefined initial state", () => {
      const { result } = renderHook(() => useIsMobile());

      // The hook should always return a boolean, never undefined
      expect(typeof result.current).toBe("boolean");
    });
  });

  describe("Performance", () => {
    it("does not create new listeners on re-renders", () => {
      const { rerender } = renderHook(() => useIsMobile());

      // Initial render creates one media query
      expect(matchMediaMock).toHaveBeenCalledTimes(1);

      // Re-render should not create additional media queries
      rerender();
      expect(matchMediaMock).toHaveBeenCalledTimes(1);

      // Multiple re-renders should still only have one media query
      rerender();
      rerender();
      expect(matchMediaMock).toHaveBeenCalledTimes(1);
    });

    it("maintains consistent return value for same screen size", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 1024,
      });

      const { result, rerender } = renderHook(() => useIsMobile());
      const initialValue = result.current;

      // Multiple re-renders with same screen size should return same value
      rerender();
      expect(result.current).toBe(initialValue);

      rerender();
      expect(result.current).toBe(initialValue);
    });
  });
});
