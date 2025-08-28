import { NextResponse } from "next/server";
import { healthService } from "@/lib/health";

// Readiness probe - checks if service is ready to accept traffic
export async function GET() {
  try {
    const healthStatus = await healthService.checkHealth();
    
    // Ready means database is connected
    const isReady = healthStatus.database.status === "connected";
    
    return NextResponse.json(
      { 
        ready: isReady,
        timestamp: healthStatus.timestamp,
        database: healthStatus.database
      }, 
      { status: isReady ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        timestamp: new Date().toISOString(),
        error: "Readiness check failed",
      },
      { status: 503 }
    );
  }
}