import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { recordRequest } from "@/lib/metrics";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      const responseTime = Date.now() - startTime;
      recordRequest("/api/events", 400, responseTime);
      
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 },
      );
    }

    const errors: string[] = [];

    // Batch validation - filter valid events upfront
    const validEvents = events.filter((event) => {
      const { id, type, email, site, timestamp } = event;
      if (!id || !type || !email || !site || !timestamp) {
        errors.push(`Missing required fields for event ${id || "unknown"}`);
        return false;
      }
      return true;
    });

    let processed = 0;
    let duplicates = 0;

    // Process valid events (optimized with simple duplicate check)
    for (const event of validEvents) {
      try {
        const { id, type, email, site, timestamp, metadata } = event;

        const existingEvent = await prisma.event.findUnique({
          where: { id },
        });

        if (existingEvent) {
          duplicates++;
          continue;
        }

        await prisma.event.create({
          data: {
            id,
            type,
            email,
            site,
            timestamp: new Date(timestamp),
            metadata,
          },
        });

        processed++;
      } catch (err) {
        errors.push(`Failed to process event ${event.id || "unknown"}`);
      }
    }

    const responseTime = Date.now() - startTime;
    recordRequest("/api/events", 201, responseTime);
    
    logger.info("Events processed", {
      totalEvents: events.length,
      validEvents: validEvents.length,
      processed,
      duplicates,
      errorCount: errors.length
    });

    return NextResponse.json(
      {
        processed,
        duplicates,
        errors,
      },
      { status: 201 },
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordRequest("/api/events", 500, responseTime);
    
    logger.error("Failed to process events", error);
    return NextResponse.json(
      { error: "Failed to process events" },
      { status: 500 },
    );
  }
}
