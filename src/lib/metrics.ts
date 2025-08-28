const metrics = {
  requests: {} as Record<string, number>,
  statusCodes: {} as Record<number, number>,
  totalRequests: 0,
  startTime: Date.now(),
};

export function recordRequest(endpoint: string, statusCode: number) {
  metrics.totalRequests++;
  metrics.requests[endpoint] = (metrics.requests[endpoint] || 0) + 1;
  metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
}

export function getMetrics() {
  return {
    ...metrics,
    uptime: Date.now() - metrics.startTime,
  };
}
