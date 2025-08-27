"use client";

import { useQuery } from "@tanstack/react-query";

interface DailyStats {
  date: string;
  site: string;
  total_events: number;
  unique_users: number;
  event_types: Record<string, number>;
}

async function fetchDailyStats(): Promise<DailyStats[]> {
  const response = await fetch("/api/stats/daily", {
    headers: {
      "x-api-key": "sk_test_123456789",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  const data = await response.json();
  return data.data;
}

export default function Dashboard() {
  const {
    data: stats = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["daily-stats"],
    queryFn: fetchDailyStats,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    console.log(error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p className="text-red-500">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Daily Stats Dashboard</h1>

      {stats.length === 0 ? (
        <p>No data available for today.</p>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.site} className="border p-4 rounded">
              <h2 className="text-lg font-semibold mb-2">{stat.site}</h2>
              <p className="text-sm text-gray-600 mb-2">Date: {stat.date}</p>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="font-medium">Total Events:</span>{" "}
                  {stat.total_events}
                </div>
                <div>
                  <span className="font-medium">Unique Users:</span>{" "}
                  {stat.unique_users}
                </div>
              </div>
              <div>
                <span className="font-medium">Event Types:</span>
                <ul className="mt-1 ml-4">
                  {Object.entries(stat.event_types).map(([type, count]) => (
                    <li key={type}>
                      {type}: {count}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
