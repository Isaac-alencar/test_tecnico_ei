import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

describe("API Key Middleware", () => {
  it("allows requests with valid API key", async () => {
    const request = new NextRequest("http://localhost/api/events", {
      headers: { "x-api-key": "sk_test_123456789" },
    });

    const response = middleware(request);
    expect(response.status).not.toBe(401);
  });

  it("rejects requests without API key", async () => {
    const request = new NextRequest("http://localhost/api/events");
    const response = middleware(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toContain("Unauthorized");
  });

  it("rejects requests with invalid API key", async () => {
    const request = new NextRequest("http://localhost/api/events", {
      headers: { "x-api-key": "invalid-key" },
    });

    const response = middleware(request);
    expect(response.status).toBe(401);
  });

  it("allows non-API routes without API key", async () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = middleware(request);

    expect(response.status).not.toBe(401);
  });

  it("allows non-API routes with any headers", async () => {
    const request = new NextRequest("http://localhost/dashboard", {
      headers: { "some-header": "value" },
    });

    const response = middleware(request);
    expect(response.status).not.toBe(401);
  });
});
