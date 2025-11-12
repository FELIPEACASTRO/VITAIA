import { beforeAll, afterAll } from "vitest";
import { ENV } from "../server/_core/env";

// Test environment setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgresql://test:test@localhost:5432/vitaia_test";
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.ENABLE_RATE_LIMIT = "false";
  process.env.ENABLE_AUDIT_LOG = "false";

  console.log("🧪 Test environment initialized");
});

afterAll(async () => {
  console.log("🧪 Test cleanup completed");
});
