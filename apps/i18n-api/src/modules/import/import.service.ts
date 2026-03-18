import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ImportDto } from './dto/import.dto';
import { generateUUID } from '@/utils/uuid';
import Trie from '@/utils/trie';

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 将嵌套 JSON 展平为点分隔的 key-value 对
   * 例如: { a: { b: 'hello' } } => { 'a.b': 'hello' }
   */
  flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, fullKey));
      } else {
        result[fullKey] = String(value ?? '');
      }
    }
    return result;
  }

  async importJson(dto: ImportDto) {
    const { projectId, strategy, files } = dto;

    // 1. 校验项目存在
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 2. 校验语言合法性
    const projectLangs = [project.sourceLocale, ...project.targetLanguages];
    for (const file of files) {
      if (!projectLangs.includes(file.lang)) {
        throw new BadRequestException(`语言 "${file.lang}" 不在项目语言列表中`);
      }
    }

    // 3. 展平所有文件的 translations，收集所有新 key 及其翻译
    const keyTranslations = new Map<string, Map<string, string>>();
    for (const file of files) {
      const flat = this.flattenObject(file.translations);
      for (const [key, value] of Object.entries(flat)) {
        if (!keyTranslations.has(key)) {
          keyTranslations.set(key, new Map());
        }
        keyTranslations.get(key)!.set(file.lang, value);
      }
    }

    // 4. 查询项目所有现有 key
    const existingKeys = await this.prisma.i18nKey.findMany({
      where: { projectId },
      select: { id: true, key: true },
    });
    const existingKeyMap = new Map(existingKeys.map((k) => [k.key, k.id]));

    // 5. 用 Trie 校验新 key 不与现有 key 冲突（结构冲突）
    const allKeyNames = [
      ...existingKeys.map((k) => k.key),
      ...[...keyTranslations.keys()].filter((k) => !existingKeyMap.has(k)),
    ];
    if (allKeyNames.length > 0) {
      const trie = new Trie();
      trie.validateKey(allKeyNames);
    }

    // 6. 在事务中执行导入
    let created = 0;
    let updated = 0;
    let skipped = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const [key, langMap] of keyTranslations) {
        const existingKeyId = existingKeyMap.get(key);

        if (!existingKeyId) {
          // 新 key — 创建 key + translations
          const keyId = generateUUID();
          await tx.i18nKey.create({
            data: { id: keyId, projectId, key },
          });
          const translationData = [...langMap.entries()]
            .filter(([, text]) => text.trim())
            .map(([lang, text]) => ({
              id: generateUUID(),
              keyId,
              lang,
              text,
            }));
          if (translationData.length > 0) {
            await tx.i18nTranslation.createMany({ data: translationData });
          }
          created++;
        } else if (strategy === 'overwrite') {
          // 已有 key + overwrite — upsert translations
          for (const [lang, text] of langMap) {
            if (!text.trim()) continue;
            const existing = await tx.i18nTranslation.findFirst({
              where: { keyId: existingKeyId, lang },
            });
            if (existing) {
              await tx.i18nTranslation.update({
                where: { id: existing.id },
                data: { text },
              });
            } else {
              await tx.i18nTranslation.create({
                data: { id: generateUUID(), keyId: existingKeyId, lang, text },
              });
            }
          }
          updated++;
        } else {
          // 已有 key + skip
          skipped++;
        }
      }
    });

    return { created, updated, skipped };
  }
}
