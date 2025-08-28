import { NextRequest, NextResponse } from "next/server";
import { recordRequest } from "@/lib/metrics";
import { validateApiKey } from "@/lib/auth";
import { logger } from "@/lib/logger";

export function middleware(request: NextRequest) {
  const startTime = Date.now();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const apiKey = request.headers.get("x-api-key");

    if (!validateApiKey(apiKey)) {
      const responseTime = Date.now() - startTime;
      recordRequest(request.nextUrl.pathname, 401, responseTime);

      logger.warn("Unauthorized API request", {
        path: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get("user-agent"),
        responseTime,
      });

      return NextResponse.json(
        { error: "Unauthorized - Invalid API Key" },
        { status: 401 },
      );
    }
  }

  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const responseTime = Date.now() - startTime;
    // Record successful requests (middleware doesn't have access to final status)
    recordRequest(request.nextUrl.pathname, 200, responseTime);

    logger.info("API request", {
      method: request.method,
      path: request.nextUrl.pathname,
      status: 200,
      responseTime: `${responseTime}ms`,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/api/(.*)",
  ],
};
