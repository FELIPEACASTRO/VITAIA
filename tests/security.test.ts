import { describe, it, expect, beforeEach } from "vitest";
import {
  InputValidator,
  RateLimiter,
  DataMasker,
  EncryptionUtils,
} from "../server/_core/security";

describe("Security", () => {
  describe("InputValidator", () => {
    let validator: InputValidator;

    beforeEach(() => {
      validator = new InputValidator();
    });

    it("should detect XSS attempts", () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "javascript:alert(1)",
        "<img src=x onerror=alert(1)>",
        "eval(maliciousCode)",
      ];

      maliciousInputs.forEach(input => {
        const result = validator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.threats.length).toBeGreaterThan(0);
      });
    });

    it("should detect SQL injection attempts", () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM passwords",
        "admin'--",
      ];

      maliciousInputs.forEach(input => {
        const result = validator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.threats).toContain("SQL_INJECTION_ATTEMPT");
      });
    });

    it("should allow safe input", () => {
      const safeInputs = [
        "Normal text input",
        "Email: user@example.com",
        "Phone: +1-555-123-4567",
        "Medical symptoms: fever, headache",
      ];

      safeInputs.forEach(input => {
        const result = validator.validateInput(input);
        expect(result.isValid).toBe(true);
        expect(result.threats).toHaveLength(0);
      });
    });

    it("should sanitize input correctly", () => {
      const input = '<script>alert("test")</script>';
      const sanitized = validator.sanitizeInput(input);

      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
      expect(sanitized).not.toContain('"');
    });
  });

  describe("RateLimiter", () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter();
    });

    it("should allow requests within limit", () => {
      const key = "test-key";
      const maxRequests = 5;
      const windowMs = 60000;

      for (let i = 0; i < maxRequests; i++) {
        const allowed = rateLimiter.checkLimit(key, maxRequests, windowMs);
        expect(allowed).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      const key = "test-key-2";
      const maxRequests = 3;
      const windowMs = 60000;

      // Use up the limit
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.checkLimit(key, maxRequests, windowMs);
      }

      // Next request should be blocked
      const blocked = rateLimiter.checkLimit(key, maxRequests, windowMs);
      expect(blocked).toBe(false);
    });
  });

  describe("DataMasker", () => {
    it("should mask email correctly", () => {
      const email = "user@example.com";
      const masked = DataMasker.maskEmail(email);

      expect(masked).toMatch(/u\*+r@example\.com/);
      expect(masked).not.toBe(email);
    });

    it("should mask CRM correctly", () => {
      const crm = "123456/SP";
      const masked = DataMasker.maskCRM(crm);

      expect(masked).toMatch(/12\*+SP/);
      expect(masked).not.toBe(crm);
    });

    it("should mask CPF correctly", () => {
      const cpf = "12345678901";
      const masked = DataMasker.maskCPF(cpf);

      expect(masked).toBe("123***901");
    });

    it("should mask phone correctly", () => {
      const phone = "11987654321";
      const masked = DataMasker.maskPhone(phone);

      expect(masked).toBe("11****4321");
    });
  });

  describe("EncryptionUtils", () => {
    it("should encrypt and decrypt data correctly", () => {
      const plaintext = "Sensitive medical data";
      const key = EncryptionUtils.generateKey();

      const encrypted = EncryptionUtils.encrypt(plaintext, key);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.encrypted).not.toBe(plaintext);

      const decrypted = EncryptionUtils.decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it("should generate different encryption results for same input", () => {
      const plaintext = "Test data";
      const key = EncryptionUtils.generateKey();

      const encrypted1 = EncryptionUtils.encrypt(plaintext, key);
      const encrypted2 = EncryptionUtils.encrypt(plaintext, key);

      // Should be different due to random IV
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // But both should decrypt to same plaintext
      expect(EncryptionUtils.decrypt(encrypted1, key)).toBe(plaintext);
      expect(EncryptionUtils.decrypt(encrypted2, key)).toBe(plaintext);
    });
  });
});
