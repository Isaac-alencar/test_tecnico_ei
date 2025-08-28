import { prisma } from "./prisma";
import { logger } from "./logger";

export interface HealthStatus {
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

export class HealthService {
  private version = process.env.npm_package_version || "0.1.0";
  private startTime = Date.now();

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const databaseStatus = await this.checkDatabase();
    const memoryStatus = this.getMemoryStatus();

    const isHealthy = databaseStatus.status === "connected";

    if (!isHealthy) {
      logger.error("Health check failed", { database: databaseStatus });
    }

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      version: this.version,
      uptime: Date.now() - this.startTime,
      environment: process.env.NODE_ENV || "development",
      database: databaseStatus,
      memory: memoryStatus,
    };
  }

  private getMemoryStatus() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const percentage = ((usedMemory / totalMemory) * 100).toFixed(1);

    return {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: `${percentage}%`
    };
  }

  private async checkDatabase(): Promise<{
    status: "connected" | "disconnected";
    responseTime?: number;
  }> {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: "connected",
        responseTime,
      };
    } catch (error) {
      return {
        status: "disconnected",
      };
    }
  }
}

export const healthService = new HealthService();
