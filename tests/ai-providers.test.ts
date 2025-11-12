import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeAI, checkProviderHealth } from "../server/_core/aiProviders";

// Mock fetch for testing
global.fetch = vi.fn();

describe("AI Providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invokeAI", () => {
    it("should handle successful OpenAI response", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            id: "test-id",
            created: Date.now(),
            model: "gpt-4o",
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: "Test medical response",
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30,
            },
          }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await invokeAI({
        messages: [{ role: "user", content: "Test medical question" }],
        provider: "openai",
      });

      expect(result.provider).toBe("openai");
      expect(result.choices[0].message.content).toBe("Test medical response");
      expect(result.usage?.total_tokens).toBe(30);
    });

    it("should handle API errors gracefully", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve("Invalid API key"),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(
        invokeAI({
          messages: [{ role: "user", content: "Test question" }],
          provider: "openai",
        })
      ).rejects.toThrow("OpenAI API failed: 401 Unauthorized");
    });

    it("should use fallback provider when enabled", async () => {
      // Mock OpenAI failure
      const failedResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("Server error"),
      };

      // Mock Gemini success
      const successResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: "Fallback response from Gemini" }],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 15,
              totalTokenCount: 25,
            },
          }),
      };

      (global.fetch as any)
        .mockResolvedValueOnce(failedResponse) // OpenAI fails
        .mockResolvedValueOnce(successResponse); // Gemini succeeds

      // Set environment for multi-provider
      process.env.ENABLE_MULTI_PROVIDER = "true";

      const result = await invokeAI({
        messages: [{ role: "user", content: "Test question" }],
        provider: "openai", // Request OpenAI but should fallback to Gemini
      });

      expect(result.provider).toBe("gemini");
      expect(result.choices[0].message.content).toBe(
        "Fallback response from Gemini"
      );
    });
  });

  describe("checkProviderHealth", () => {
    it("should check health of all providers", async () => {
      // Mock successful responses for all providers
      const mockSuccessResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "Hello" } }],
          }),
      };

      (global.fetch as any).mockResolvedValue(mockSuccessResponse);

      const health = await checkProviderHealth();

      expect(health.openai).toBe(true);
      expect(health.gemini).toBe(true);
      expect(health.deepseek).toBe(true);
    });

    it("should handle provider failures in health check", async () => {
      // Mock mixed responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ choices: [{ message: { content: "OK" } }] }),
        }) // OpenAI success
        .mockRejectedValueOnce(new Error("Network error")) // Gemini failure
        .mockResolvedValueOnce({ ok: false, status: 401 }); // DeepSeek failure

      const health = await checkProviderHealth();

      expect(health.openai).toBe(true);
      expect(health.gemini).toBe(false);
      expect(health.deepseek).toBe(false);
    });
  });

  describe("Message formatting", () => {
    it("should handle different message content types", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            id: "test",
            created: Date.now(),
            model: "gpt-4o",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "Response" },
                finish_reason: "stop",
              },
            ],
          }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Test string content
      await invokeAI({
        messages: [{ role: "user", content: "Simple string" }],
        provider: "openai",
      });

      // Test array content
      await invokeAI({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Text part" },
              {
                type: "image_url",
                image_url: { url: "https://example.com/image.jpg" },
              },
            ],
          },
        ],
        provider: "openai",
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
