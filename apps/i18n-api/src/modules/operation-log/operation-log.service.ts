import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQuery } from '@/common/types/pagination.types';
import { toPaginatedResult, toPaginationOptions } from '@/common/utils/pagination.util';

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(projectId: string, options: PaginationQuery) {
    const paginationOptions = toPaginationOptions(options);
    const where = { projectId };

    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        skip: paginationOptions.skip,
        take: paginationOptions.take,
        orderBy: { operationAt: 'desc' },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return toPaginatedResult(items, total, paginationOptions);
  }
}
