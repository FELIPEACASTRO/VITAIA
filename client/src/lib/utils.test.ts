import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  describe("Basic functionality", () => {
    it("combines class names correctly", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("handles empty strings", () => {
      const result = cn("", "class1", "", "class2");
      expect(result).toBe("class1 class2");
    });

    it("handles undefined and null values", () => {
      const result = cn("class1", undefined, "class2", null);
      expect(result).toBe("class1 class2");
    });

    it("handles boolean conditions", () => {
      const result = cn("base", true && "conditional", false && "hidden");
      expect(result).toBe("base conditional");
    });
  });

  describe("Tailwind merge functionality", () => {
    it("merges conflicting Tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4");
      expect(result).toBe("py-1 px-4");
    });

    it("handles responsive classes", () => {
      const result = cn("text-sm", "md:text-lg", "lg:text-xl");
      expect(result).toBe("text-sm md:text-lg lg:text-xl");
    });

    it("merges background colors correctly", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("merges padding classes correctly", () => {
      const result = cn("p-4", "px-2", "py-8");
      // tailwind-merge keeps p-4 because it doesn't conflict with specific px/py
      expect(result).toBe("p-4 px-2 py-8");
    });

    it("handles hover states", () => {
      const result = cn("hover:bg-red-500", "hover:bg-blue-500");
      expect(result).toBe("hover:bg-blue-500");
    });
  });

  describe("Complex scenarios", () => {
    it("handles arrays of classes", () => {
      const result = cn(["class1", "class2"], "class3");
      expect(result).toBe("class1 class2 class3");
    });

    it("handles objects with boolean values", () => {
      const result = cn({
        "base-class": true,
        "conditional-class": true,
        "hidden-class": false,
      });
      expect(result).toBe("base-class conditional-class");
    });

    it("handles mixed types", () => {
      const result = cn(
        "base",
        ["array1", "array2"],
        {
          "object-true": true,
          "object-false": false,
        },
        "final"
      );
      expect(result).toBe("base array1 array2 object-true final");
    });

    it("handles component variant patterns", () => {
      const variant = "primary";
      const size = "lg";
      const disabled = false;

      const result = cn(
        "btn",
        {
          "btn-primary": variant === "primary",
          "btn-secondary": variant === "secondary",
          "btn-lg": size === "lg",
          "btn-sm": size === "sm",
          "btn-disabled": disabled,
        }
      );

      expect(result).toBe("btn btn-primary btn-lg");
    });
  });

  describe("Edge cases", () => {
    it("handles no arguments", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("handles only falsy values", () => {
      const result = cn(false, null, undefined, "");
      expect(result).toBe("");
    });

    it("handles nested arrays", () => {
      const result = cn(["outer", ["nested1", "nested2"]], "final");
      expect(result).toBe("outer nested1 nested2 final");
    });

    it("handles very long class lists", () => {
      const classes = Array.from({ length: 50 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result).toContain("class-0");
      expect(result).toContain("class-49");
    });
  });

  describe("Real-world usage patterns", () => {
    it("handles button component pattern", () => {
      const variant = "outline";
      const size = "sm";
      const className = "custom-class";

      const result = cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "border border-input hover:bg-accent": variant === "outline",
          "h-10 px-4 py-2": size === "default",
          "h-9 px-3": size === "sm",
          "h-11 px-8": size === "lg",
        },
        className
      );

      expect(result).toContain("border border-input hover:bg-accent");
      expect(result).toContain("h-9 px-3");
      expect(result).toContain("custom-class");
    });

    it("handles card component pattern", () => {
      const hover = true;
      const selected = false;

      const result = cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        {
          "hover:shadow-md transition-shadow": hover,
          "ring-2 ring-primary": selected,
        }
      );

      expect(result).toContain("hover:shadow-md transition-shadow");
      expect(result).not.toContain("ring-2 ring-primary");
    });

    it("handles responsive grid pattern", () => {
      const result = cn(
        "grid gap-4",
        "grid-cols-1",
        "sm:grid-cols-2",
        "md:grid-cols-3",
        "lg:grid-cols-4"
      );

      expect(result).toBe("grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4");
    });
  });
});
