import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../app/api/events/route";
import mixedEventsFixture from "../fixtures/mixed-events.json";

const API_BASE_URL = "http://localhost:3000/api/events";

// Step 1: Mock the singleton module before any imports (hoisted)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(), // Fresh mock instances created here
      create: vi.fn(),
    },
  },
}));

// Step 2: Import the mocked singleton and grab typed references
import { prisma } from "@/lib/prisma";
const mockPrisma = prisma as any;

// Step 3: Create easy-to-use references for our tests
const mockEventMethods = {
  findUnique: mockPrisma.event.findUnique,
  create: mockPrisma.event.create,
};

describe("/api/events POST", () => {
  beforeEach(() => {
    // Clean slate for each test
    vi.clearAllMocks();
    mockEventMethods.findUnique.mockReset();
    mockEventMethods.create.mockReset();
  });

  it("returns 400 for missing events array", async () => {
    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Events array is required");
  });

  it("handles events with missing required fields", async () => {
    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify({
        events: [{ id: "evt_001" }],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      processed: 0,
      duplicates: 0,
      errors: ["Missing required fields for event evt_001"],
    });
  });

  it("processes valid event successfully", async () => {
    mockEventMethods.findUnique.mockResolvedValue(null);
    mockEventMethods.create.mockResolvedValue({});

    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            id: "evt_001",
            type: "sent",
            email: "user@example.com",
            site: "site-a.com",
            timestamp: "2024-01-20T10:30:00Z",
            metadata: { campaign_id: "camp_123" },
          },
        ],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      processed: 1,
      duplicates: 0,
      errors: [],
    });
  });

  it("detects duplicate events", async () => {
    mockEventMethods.findUnique.mockResolvedValue({
      id: "evt_001",
      type: "sent",
    });

    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            id: "evt_001",
            type: "sent",
            email: "user@example.com",
            site: "site-a.com",
            timestamp: "2024-01-20T10:30:00Z",
          },
        ],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      processed: 0,
      duplicates: 1,
      errors: [],
    });
    // Verify create was never called for duplicates
    expect(mockEventMethods.create).not.toHaveBeenCalled();
  });

  it("handles complex mixed batch from fixture", async () => {
    mockEventMethods.findUnique
      .mockResolvedValueOnce(null) // evt_001 - new
      .mockResolvedValueOnce({ id: "evt_002" }) // evt_002 - duplicate
      .mockResolvedValueOnce(null) // evt_003 - new
      .mockResolvedValueOnce({ id: "evt_004" }) // evt_004 - duplicate
      .mockResolvedValueOnce(null) // evt_005 - new
      .mockResolvedValueOnce(null) // evt_007 - new (evt_006 skipped - invalid)
      .mockResolvedValueOnce({ id: "evt_008" }) // evt_008 - duplicate
      .mockResolvedValueOnce(null); // evt_010 - new (evt_009 skipped - invalid)

    mockEventMethods.create.mockResolvedValue({});

    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify(mixedEventsFixture),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      processed: 5, // evt_001, evt_003, evt_005, evt_007, evt_010
      duplicates: 3, // evt_002, evt_004, evt_008
      errors: [
        "Missing required fields for event evt_006", // missing type
        "Missing required fields for event evt_009", // missing email, site
      ],
    });
  });

  it("handles database errors gracefully", async () => {
    // Setup: First event succeeds, second fails during creation
    mockEventMethods.findUnique
      .mockResolvedValueOnce(null) // evt_001 - new, will succeed
      .mockResolvedValueOnce(null); // evt_002 - new, will fail during create

    mockEventMethods.create
      .mockResolvedValueOnce({}) // evt_001 - success
      .mockRejectedValueOnce(new Error("Database connection failed")); // evt_002 - fails

    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            id: "evt_001",
            type: "sent",
            email: "success@example.com",
            site: "site-a.com",
            timestamp: "2024-01-20T10:00:00Z",
          },
          {
            id: "evt_002",
            type: "open",
            email: "fail@example.com",
            site: "site-b.com",
            timestamp: "2024-01-20T10:05:00Z",
          },
        ],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      processed: 1, // evt_001 succeeded
      duplicates: 0,
      errors: ["Failed to process event evt_002"], // evt_002 failed
    });

    // Verify both events were attempted
    expect(mockEventMethods.findUnique).toHaveBeenCalledTimes(2);
    expect(mockEventMethods.create).toHaveBeenCalledTimes(2);
  });

  it("continues processing after database errors", async () => {
    // Setup: Mix of success, database error, and duplicate
    mockEventMethods.findUnique
      .mockRejectedValueOnce(new Error("Database timeout")) // evt_001 - findUnique fails
      .mockResolvedValueOnce(null) // evt_002 - new, will succeed
      .mockResolvedValueOnce({ id: "evt_003" }); // evt_003 - duplicate

    mockEventMethods.create.mockResolvedValue({});

    const request = new NextRequest(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            id: "evt_001",
            type: "sent",
            email: "timeout@example.com",
            site: "site-a.com",
            timestamp: "2024-01-20T10:00:00Z",
          },
          {
            id: "evt_002",
            type: "open",
            email: "success@example.com",
            site: "site-b.com",
            timestamp: "2024-01-20T10:05:00Z",
          },
          {
            id: "evt_003",
            type: "click",
            email: "duplicate@example.com",
            site: "site-c.com",
            timestamp: "2024-01-20T10:10:00Z",
          },
        ],
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      processed: 1, // evt_002 succeeded
      duplicates: 1, // evt_003 was duplicate
      errors: ["Failed to process event evt_001"], // evt_001 failed during findUnique
    });

    // Verify all valid events were attempted
    expect(mockEventMethods.findUnique).toHaveBeenCalledTimes(3);
    expect(mockEventMethods.create).toHaveBeenCalledTimes(1); // Only evt_002
  });
});
