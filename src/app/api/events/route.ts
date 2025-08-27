import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 },
      );
    }

    let processed = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        const { id, type, email, site, timestamp, metadata } = event;

        if (!id || !type || !email || !site || !timestamp) {
          errors.push(`Missing required fields for event ${id || "unknown"}`);
          continue;
        }

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

    return NextResponse.json(
      {
        processed,
        duplicates,
        errors,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process events" },
      { status: 500 },
    );
  }
}
