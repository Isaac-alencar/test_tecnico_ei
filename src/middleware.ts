import { NextRequest, NextResponse } from "next/server";
import { recordRequest } from "@/lib/metrics";

const VALID_API_KEY = "sk_test_123456789"; // Em produção, usar variável de ambiente

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey || apiKey !== VALID_API_KEY) {
      recordRequest(request.nextUrl.pathname, 401);
      return NextResponse.json(
        { error: "Unauthorized - Invalid API Key" },
        { status: 401 },
      );
    }
  }

  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    recordRequest(request.nextUrl.pathname, response.status || 200);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
