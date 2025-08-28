import { NextResponse } from "next/server";

// Liveness probe - checks if service is alive (simpler check)
export async function GET() {
  try {
    const memUsage = process.memoryUsage();
    const isAlive = true; // Service is running if it can respond
    
    return NextResponse.json(
      { 
        alive: isAlive,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024)
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        alive: false,
        timestamp: new Date().toISOString(),
        error: "Liveness check failed",
      },
      { status: 503 }
    );
  }
}