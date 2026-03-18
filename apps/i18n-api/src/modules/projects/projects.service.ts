import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProjectDto, EditProjectDto } from './dto';
import { customNanoid } from '@/common/utils/common';
import { generateUUID } from '@/utils/uuid';
import { Prisma } from '@/generated/prisma/client';
import { PaginationQuery } from '@/common/types/pagination.types';
import { toPaginatedResult, toPaginationOptions } from '@/common/utils/pagination.util';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateProjectDto) {
    const slug = customNanoid()();

    return this.prisma.project.create({
      data: {
        ...body,
        slug,
        id: generateUUID(),
      },
    });
  }

  async list(teamSlug: string, options: PaginationQuery & { search?: string }) {
    const paginationOptions = toPaginationOptions(options);
    const where: Prisma.ProjectWhereInput = { team: { slug: teamSlug } };
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: paginationOptions.skip,
        take: paginationOptions.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          sourceLocale: true,
          targetLanguages: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { keys: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const mapped = items.map(({ _count, ...rest }) => ({
      ...rest,
      keyCount: _count.keys,
    }));
    return toPaginatedResult(mapped, total, paginationOptions);
  }

  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    return project;
  }

  async getProjectBySlug(teamSlug: string, slug: string) {
    const team = await this.prisma.team.findUnique({
      where: { slug: teamSlug },
    });
    if (!team) {
      throw new NotFoundException('团队不存在');
    }
    const project = await this.prisma.project.findFirst({
      where: { teamId: team.id, slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sourceLocale: true,
        targetLanguages: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { keys: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }
    const { _count, ...rest } = project;
    return {
      project: {
        ...rest,
        keyCount: _count.keys,
      },
    };
  }

  async editProject(dto: EditProjectDto) {
    return this.prisma.project.update({
      where: { id: dto.id },
      data: {
        name: dto.name,
        description: dto.description,
        targetLanguages: dto.targetLanguages,
        updatedAt: new Date(),
      },
    });
  }

  async deleteProject(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 查找关于这个项目 的key
      const keys = await tx.i18nKey.findMany({ where: { projectId: id } });
      if (keys.length > 0) {
        for (const key of keys) {
          // 删除这个key 的翻译
          await tx.i18nTranslation.deleteMany({ where: { keyId: key.id } });
        }
      }
      // 删除这个项目的key
      await tx.i18nKey.deleteMany({ where: { projectId: id } });
      // 删除这个项目
      await tx.project.delete({ where: { id } });
      return { message: '项目删除成功' };
    });
  }
}
