import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("data-slot", "button");
    });

    it("renders with custom text", () => {
      render(<Button>Custom Button Text</Button>);

      expect(screen.getByText("Custom Button Text")).toBeInTheDocument();
    });

    it("renders as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link", { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });
  });

  describe("Variants", () => {
    it("applies default variant classes", () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("applies destructive variant classes", () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive", "text-white");
    });

    it("applies outline variant classes", () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border", "bg-transparent");
    });

    it("applies secondary variant classes", () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("applies ghost variant classes", () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("applies link variant classes", () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary", "underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("applies default size classes", () => {
      render(<Button>Default Size</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "px-4", "py-2");
    });

    it("applies small size classes", () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8", "px-3");
    });

    it("applies large size classes", () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "px-6");
    });

    it("applies icon size classes", () => {
      render(
        <Button size="icon" aria-label="Icon button">
          🔍
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-9");
    });

    it("applies icon-sm size classes", () => {
      render(
        <Button size="icon-sm" aria-label="Small icon button">
          🔍
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-8");
    });

    it("applies icon-lg size classes", () => {
      render(
        <Button size="icon-lg" aria-label="Large icon button">
          🔍
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-10");
    });
  });

  describe("States", () => {
    it("applies disabled state correctly", () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none",
        "disabled:opacity-50"
      );
    });

    it("is enabled by default", () => {
      render(<Button>Enabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
    });
  });

  describe("Interactions", () => {
    it("calls onClick handler when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Clickable</Button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom Props", () => {
    it("accepts custom className", () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("accepts custom attributes", () => {
      render(
        <Button data-testid="custom-button" id="btn-1">
          Custom
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-testid", "custom-button");
      expect(button).toHaveAttribute("id", "btn-1");
    });

    it("supports type attribute", () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("Accessibility", () => {
    it("has proper button role", () => {
      render(<Button>Accessible Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      render(<Button aria-label="Close dialog">×</Button>);

      const button = screen.getByRole("button", { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <div>
          <Button aria-describedby="help-text">Submit</Button>
          <div id="help-text">This will submit the form</div>
        </div>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "help-text");
    });

    it("has focus-visible styles", () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:ring-ring/50");
    });
  });

  describe("Combination Props", () => {
    it("combines variant and size correctly", () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border", "bg-transparent", "h-10", "px-6");
    });

    it("combines all props correctly", () => {
      const handleClick = vi.fn();

      render(
        <Button
          variant="destructive"
          size="sm"
          disabled
          className="custom-class"
          onClick={handleClick}
          data-testid="complex-button"
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive", "h-8", "custom-class");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-testid", "complex-button");
    });
  });
});
