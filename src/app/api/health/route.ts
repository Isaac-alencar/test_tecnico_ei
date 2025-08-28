import { NextResponse } from "next/server";
import { healthService } from "@/lib/health";
import { recordRequest } from "@/lib/metrics";

export async function GET() {
  const startTime = Date.now();
  
  try {
    const healthStatus = await healthService.checkHealth();
    
    const statusCode = healthStatus.status === "healthy" ? 200 : 503;
    const responseTime = Date.now() - startTime;
    recordRequest("/api/health", statusCode, responseTime);
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordRequest("/api/health", 503, responseTime);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}