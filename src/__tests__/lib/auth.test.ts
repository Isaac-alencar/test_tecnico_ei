import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateApiKey } from "@/lib/auth";

describe("Auth utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates API key from environment", () => {
    vi.stubEnv("API_KEYS", "sk_test_123,sk_dev_456");

    expect(validateApiKey("sk_test_123")).toBe(true);
    expect(validateApiKey("sk_dev_456")).toBe(true);
    expect(validateApiKey("invalid_key")).toBe(false);
  });

  it("falls back to hardcoded key when env not set", () => {
    vi.stubEnv("API_KEYS", "");

    expect(validateApiKey("sk_test_123456789")).toBe(true);
    expect(validateApiKey("invalid_key")).toBe(false);
  });

  it("rejects null/empty keys", () => {
    expect(validateApiKey(null)).toBe(false);
    expect(validateApiKey("")).toBe(false);
  });
});
