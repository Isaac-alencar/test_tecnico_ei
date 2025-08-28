import { NextResponse } from "next/server";
import { healthService } from "@/lib/health";

export async function GET() {
  try {
    const healthStatus = await healthService.checkHealth();
    
    const statusCode = healthStatus.status === "healthy" ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
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