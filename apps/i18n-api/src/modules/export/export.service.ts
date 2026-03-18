import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { NestedObject } from '@/common/types/api.types';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 将扁平的点分隔 key 转换为嵌套对象
   * 例如: tranformKeytoObject('a.b.c', 'hello') => { a: { b: { c: 'hello' } } }
   */
  tranformKeytoObject(key: string, value: string) {
    const parts = key.split('.');
    if (parts.length === 1) return { [key]: value };
    const res: NestedObject = {};
    parts.reduce<NestedObject>((cur, part, i) => {
      const isLast = i === parts.length - 1;
      cur[part] = isLast ? value : {};
      return cur[part] as NestedObject;
    }, res);
    return res;
  }

  /**
   * 深度合并两个嵌套对象，将 source 合并到 target 中
   * 同为对象的字段递归合并，否则用 source 的值覆盖
   */
  private deepMerge(target: NestedObject, source: NestedObject): NestedObject {
    for (const key of Object.keys(source)) {
      const srcVal = source[key];
      const tgtVal = target[key];
      if (typeof srcVal === 'object' && typeof tgtVal === 'object') {
        target[key] = this.deepMerge(tgtVal as NestedObject, srcVal as NestedObject);
      } else {
        target[key] = srcVal as string;
      }
    }
    return target;
  }

  /**
   * 导出项目的所有翻译为 JSON 结构
   * 返回格式: { [语言代码]: { 嵌套的翻译键值对 } }
   */
  async exportJsonZip(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 查询项目下所有 key 及其翻译
    const keys = await this.prisma.i18nKey.findMany({
      where: { projectId },
      include: {
        i18Ntranslations: true,
      },
    });

    // 合并源语言和目标语言，初始化每种语言的空对象
    const translateLanguages = [project.sourceLocale, ...project.targetLanguages];
    const result: NestedObject = Object.fromEntries(translateLanguages.map((l) => [l, {}]));

    // 遍历每个 key，将其翻译按语言合并到对应的嵌套结构中
    for (const key of keys) {
      const translationMap = new Map(key.i18Ntranslations.map((t) => [t.lang, t.text]));

      for (const lang of translateLanguages) {
        this.deepMerge(
          result[lang] as NestedObject,
          this.tranformKeytoObject(key.key, translationMap.get(lang) || '')
        );
      }
    }
    return result;
  }
}
