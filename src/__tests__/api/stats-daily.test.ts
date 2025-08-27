import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/stats/daily/route";

const API_BASE_URL = "http://localhost:3000/api/stats/daily";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
const mockPrisma = prisma as any;

describe("/api/stats/daily GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.event.findMany.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-27T15:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty data when no events for today", async () => {
    mockPrisma.event.findMany.mockResolvedValue([]);

    const request = new NextRequest(API_BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ data: [] });
  });

  it("aggregates stats by site for today", async () => {
    const mockEvents = [
      {
        id: "evt_001",
        type: "sent",
        email: "user1@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T10:00:00Z"),
      },
      {
        id: "evt_002",
        type: "open",
        email: "user1@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T11:00:00Z"),
      },
      {
        id: "evt_003",
        type: "click",
        email: "user2@example.com",
        site: "promo.com",
        timestamp: new Date("2025-08-27T12:00:00Z"),
      },
    ];

    mockPrisma.event.findMany.mockResolvedValue(mockEvents);

    const request = new NextRequest(API_BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(2);

    const newsletterStats = json.data.find(
      (s: any) => s.site === "newsletter.com",
    );
    expect(newsletterStats).toEqual({
      date: "2025-08-27",
      site: "newsletter.com",
      total_events: 2,
      unique_users: 1,
      event_types: {
        sent: 1,
        open: 1,
      },
    });

    const promoStats = json.data.find((s: any) => s.site === "promo.com");
    expect(promoStats).toEqual({
      date: "2025-08-27",
      site: "promo.com",
      total_events: 1,
      unique_users: 1,
      event_types: {
        click: 1,
      },
    });
  });

  it("filters out unknown event types", async () => {
    const mockEvents = [
      {
        id: "evt_001",
        type: "sent",
        email: "user1@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T10:00:00Z"),
      },
      {
        id: "evt_002",
        type: "bounce",
        email: "user2@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T11:00:00Z"),
      },
    ];

    mockPrisma.event.findMany.mockResolvedValue(mockEvents);

    const request = new NextRequest(API_BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toEqual({
      date: "2025-08-27",
      site: "newsletter.com",
      total_events: 1,
      unique_users: 1,
      event_types: {
        sent: 1,
      },
    });
  });

  it("counts unique users correctly", async () => {
    const mockEvents = [
      {
        id: "evt_001",
        type: "sent",
        email: "user1@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T10:00:00Z"),
      },
      {
        id: "evt_002",
        type: "open",
        email: "user1@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T11:00:00Z"),
      },
      {
        id: "evt_003",
        type: "click",
        email: "user2@example.com",
        site: "newsletter.com",
        timestamp: new Date("2025-08-27T12:00:00Z"),
      },
    ];

    mockPrisma.event.findMany.mockResolvedValue(mockEvents);

    const request = new NextRequest(API_BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0].unique_users).toBe(2);
  });

  it("handles database errors gracefully", async () => {
    mockPrisma.event.findMany.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(API_BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to fetch daily stats");
  });
});
