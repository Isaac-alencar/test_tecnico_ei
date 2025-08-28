import { prisma } from "./prisma";

export interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  database: {
    status: "connected" | "disconnected";
    responseTime?: number;
  };
}

export class HealthService {
  private version = process.env.npm_package_version || "0.1.0";

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const databaseStatus = await this.checkDatabase();

    const isHealthy = databaseStatus.status === "connected";

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      version: this.version,
      database: databaseStatus,
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
