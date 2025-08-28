import { NextResponse } from "next/server";

// Service information endpoint
export async function GET() {
  return NextResponse.json({
    service: {
      name: "everinbox-assessment",
      version: process.env.npm_package_version || "0.1.0",
      description: "Event tracking microservice for Everinbox assessment",
      environment: process.env.NODE_ENV || "development"
    },
    endpoints: {
      health: "/api/health",
      liveness: "/api/health/live", 
      readiness: "/api/health/ready",
      metrics: "/api/metrics",
      events: "POST /api/events",
      stats: "GET /api/stats/daily"
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    timestamp: new Date().toISOString()
  });
}