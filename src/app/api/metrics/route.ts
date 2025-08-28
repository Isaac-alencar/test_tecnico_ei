import { NextResponse } from "next/server";
import { getMetrics, recordRequest } from "@/lib/metrics";

export async function GET() {
  // Record this metrics request
  recordRequest("/api/metrics", 200, 0);
  
  const metrics = getMetrics();
  
  // Enhanced JSON format with better structure
  return NextResponse.json({
    service: "everinbox-assessment",
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(metrics.uptime / 1000)}s`,
    requests: {
      total: metrics.totalRequests,
      errors: metrics.errors,
      errorRate: metrics.errorRate,
      avgResponseTime: `${Math.round(metrics.avgResponseTime)}ms`
    },
    endpoints: metrics.requests,
    statusCodes: metrics.statusCodes
  });
}