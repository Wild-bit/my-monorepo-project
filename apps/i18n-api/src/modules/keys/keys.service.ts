import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PaginationQuery } from '@/common/types/pagination.types';
import { toPaginatedResult, toPaginationOptions } from '@/common/utils/pagination.util';
import { Prisma } from '@/generated/prisma/client';
import { CreateKeyDto, EditKeyDto } from './dto/create-key.dto';
import { generateUUID } from '@/utils/uuid';

@Injectable()
export class KeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKeyDto) {
    const { translations, ...keyData } = dto;

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return this.prisma.$transaction(async (tx) => {
      const key = await tx.i18nKey.create({
        data: {
          id: generateUUID(),
          ...keyData,
        },
      });

      // 批量创建翻译记录（过滤掉空文本）
      const translationData = Object.entries(translations)
        .filter(([, text]) => text.trim())
        .map(([lang, text]) => ({
          id: generateUUID(),
          keyId: key.id,
          lang,
          text,
        }));

      if (translationData.length > 0) {
        await tx.i18nTranslation.createMany({ data: translationData });
      }
      return {
        ...key,
        translations: translationData,
      };
    });
  }

  async getKeysList(projectId: string, options: PaginationQuery & { search?: string }) {
    const paginationOptions = toPaginationOptions(options);
    const where: Prisma.I18nKeyWhereInput = { projectId };
    if (options.search) {
      where.key = { contains: options.search, mode: 'insensitive' };
    }
    const [items, total] = await Promise.all([
      this.prisma.i18nKey.findMany({
        where,
        include: {
          i18Ntranslations: {
            select: {
              id: true,
              text: true,
              lang: true,
            },
          },
        },
        omit: {
          createdAt: true,
          updatedAt: true,
        },
        skip: paginationOptions.skip,
        take: paginationOptions.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.i18nKey.count({ where }),
    ]);
    const resItems = items.map((item) => {
      const { i18Ntranslations, ...rest } = item;
      return {
        ...rest,
        translations: i18Ntranslations,
      };
    });
    return toPaginatedResult(resItems, total, paginationOptions);
  }

  async edit(dto: EditKeyDto) {
    const { id, translations, description, key } = dto;
    return this.prisma.$transaction(async (tx) => {
      await tx.i18nKey.update({ where: { id }, data: { key, description, updatedAt: new Date() } });
      await tx.i18nTranslation.deleteMany({ where: { keyId: id } });
      const translationData = Object.entries(translations)
        .filter(([, text]) => text.trim())
        .map(([lang, text]) => ({ id: generateUUID(), keyId: id, lang, text }));
      if (translationData.length > 0) {
        await tx.i18nTranslation.createMany({ data: translationData });
      }
      return {
        id,
        key,
        description,
        translations: translationData,
      };
    });
  }

  async delete(id: string) {
    const key = await this.prisma.i18nKey.findUnique({ where: { id } });
    if (!key) {
      throw new NotFoundException('Key 不存在');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.i18nTranslation.deleteMany({ where: { keyId: id } });
      await tx.i18nKey.delete({ where: { id } });
    });
  }
}
