import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../server/_core/auth";

describe("AuthService", () => {
  describe("Password hashing", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123";
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify password correctly", async () => {
      const password = "testPassword123";
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthService.verifyPassword("wrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("JWT tokens", () => {
    it("should generate valid JWT token", () => {
      const user = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
      };

      const token = AuthService.generateToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should verify JWT token correctly", () => {
      const user = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
      };

      const token = AuthService.generateToken(user);
      const decoded = AuthService.verifyToken(token);

      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it("should reject invalid JWT token", () => {
      expect(() => {
        AuthService.verifyToken("invalid-token");
      }).toThrow("Token inválido");
    });
  });
});
