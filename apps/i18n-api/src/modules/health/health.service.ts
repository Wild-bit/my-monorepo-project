import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    // 检查数据库连接
    let dbStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
