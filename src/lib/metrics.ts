const metrics = {
  requests: {} as Record<string, number>,
  statusCodes: {} as Record<number, number>,
  totalRequests: 0,
  startTime: Date.now(),
  errors: 0,
  avgResponseTime: 0,
  requestTimes: [] as number[]
};

export function recordRequest(endpoint: string, statusCode: number, responseTime?: number) {
  metrics.totalRequests++;
  metrics.requests[endpoint] = (metrics.requests[endpoint] || 0) + 1;
  metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
  
  if (statusCode >= 400) {
    metrics.errors++;
  }

  if (responseTime) {
    metrics.requestTimes.push(responseTime);
    // Keep only last 100 response times for average calculation
    if (metrics.requestTimes.length > 100) {
      metrics.requestTimes.shift();
    }
    metrics.avgResponseTime = metrics.requestTimes.reduce((a, b) => a + b, 0) / metrics.requestTimes.length;
  }
  
  // Simple debug log
  console.log(`[METRICS] ${endpoint} ${statusCode} (Total: ${metrics.totalRequests})`);
}

export function getMetrics() {
  return {
    ...metrics,
    uptime: Date.now() - metrics.startTime,
    errorRate: metrics.totalRequests > 0 ? (metrics.errors / metrics.totalRequests * 100).toFixed(2) + '%' : '0%'
  };
}
