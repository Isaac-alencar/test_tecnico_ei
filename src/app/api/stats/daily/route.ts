import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordRequest } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (events.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const knownTypes = ["sent", "open", "click", "complaint"];

    const statsBySite: Record<string, any> = {};

    for (const event of events) {
      if (!knownTypes.includes(event.type)) continue;

      const site = event.site;

      if (!statsBySite[site]) {
        statsBySite[site] = {
          site,
          total_events: 0,
          unique_users: new Set(),
          event_types: {},
        };
      }

      statsBySite[site].total_events++;
      statsBySite[site].unique_users.add(event.email);

      const eventType = event.type;
      if (!statsBySite[site].event_types[eventType]) {
        statsBySite[site].event_types[eventType] = 0;
      }
      statsBySite[site].event_types[eventType]++;
    }

    const [todayDate] = today.toISOString().split("T");

    const data = Object.values(statsBySite).map((stats: any) => ({
      date: todayDate,
      site: stats.site,
      total_events: stats.total_events,
      unique_users: stats.unique_users.size,
      event_types: stats.event_types,
    }));

    const responseTime = Date.now() - startTime;
    recordRequest("/api/stats/daily", 200, responseTime);
    
    return NextResponse.json({ data });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordRequest("/api/stats/daily", 500, responseTime);
    
    return NextResponse.json(
      { error: "Failed to fetch daily stats" },
      { status: 500 },
    );
  }
}
