"use client";

import { useQuery } from "@tanstack/react-query";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  database: {
    status: "connected" | "disconnected";
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: string;
  };
}

interface Metrics {
  service: string;
  timestamp: string;
  uptime: string;
  requests: {
    total: number;
    errors: number;
    errorRate: string;
    avgResponseTime: string;
  };
  endpoints: Record<string, number>;
  statusCodes: Record<number, number>;
}

async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch("/api/health", {
    headers: {
      "x-api-key": "sk_test_123456789",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch health");
  }
  return response.json();
}

async function fetchMetrics(): Promise<Metrics> {
  const response = await fetch("/api/metrics", {
    headers: {
      "x-api-key": "sk_test_123456789",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch metrics");
  }
  return response.json();
}

export default function MetricsPage() {
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
  } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
  });

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API Metrics & Health</h1>
        <a
          href="/dashboard"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Health Status</h2>
          {healthLoading && <p>Loading health...</p>}
          {healthError && <p className="text-red-500">Error loading health</p>}
          {health && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    health.status === "healthy" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium capitalize">{health.status}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-medium">Version:</span> {health.version}
                  </p>
                  <p>
                    <span className="font-medium">Environment:</span>{" "}
                    <span className={
                      health.environment === "production" ? "text-red-600" : "text-blue-600"
                    }>
                      {health.environment}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Uptime:</span> {formatUptime(health.uptime)}
                  </p>
                </div>
                
                <div>
                  <p>
                    <span className="font-medium">Memory:</span>{" "}
                    {health.memory.used}MB / {health.memory.total}MB
                    <span className="ml-2 text-gray-600">({health.memory.percentage})</span>
                  </p>
                  <p>
                    <span className="font-medium">Database:</span>{" "}
                    <span
                      className={
                        health.database.status === "connected"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {health.database.status}
                    </span>
                    {health.database.responseTime && (
                      <span className="ml-2 text-gray-600">
                        ({health.database.responseTime}ms)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 pt-2 border-t">
                Last check: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* API Metrics */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Metrics</h2>
          {metricsLoading && <p>Loading metrics...</p>}
          {metricsError && (
            <p className="text-red-500">Error loading metrics</p>
          )}
          {metrics && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">Total Requests:</span>{" "}
                {metrics.requests.total}
              </div>
              <div>
                <span className="font-medium">Uptime:</span>{" "}
                {metrics.uptime}
              </div>
              <div>
                <span className="font-medium">Errors:</span>{" "}
                <span className="text-red-600">{metrics.requests.errors}</span>
                {" "}({metrics.requests.errorRate})
              </div>
              <div>
                <span className="font-medium">Avg Response Time:</span>{" "}
                {metrics.requests.avgResponseTime}
              </div>

              <div>
                <h3 className="font-medium mb-2">Requests by Endpoint:</h3>
                <div className="ml-4 space-y-1">
                  {Object.keys(metrics.endpoints).length > 0 ? (
                    Object.entries(metrics.endpoints).map(([endpoint, count]) => (
                      <div key={endpoint} className="text-sm">
                        {endpoint}: {count}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No requests yet</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Status Codes:</h3>
                <div className="ml-4 space-y-1">
                  {Object.keys(metrics.statusCodes).length > 0 ? (
                    Object.entries(metrics.statusCodes).map(([code, count]) => (
                      <div key={code} className="text-sm">
                        <span
                          className={
                            code.startsWith("2")
                              ? "text-green-600"
                              : code.startsWith("4") || code.startsWith("5")
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {code}: {count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No requests yet</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
