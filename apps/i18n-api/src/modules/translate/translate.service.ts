import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '@/prisma/prisma.service';
import { buildTranslatePrompt } from './prompt/translate.prompt';

// 语言代码 -> 语言名称映射
const LANG_NAMES: Record<string, string> = {
  'zh-cn': '简体中文',
  'zh-tw': '繁体中文',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  fr: '法语',
  de: '德语',
  es: '西班牙语',
  pt: '葡萄牙语',
  it: '意大利语',
  ru: '俄语',
  ar: '阿拉伯语',
  th: '泰语',
  vi: '越南语',
  id: '印尼语',
  ms: '马来语',
  hi: '印地语',
  tr: '土耳其语',
  nl: '荷兰语',
  pl: '波兰语',
  sv: '瑞典语',
  da: '丹麦语',
  no: '挪威语',
  fi: '芬兰语',
};

function getLangName(code: string): string {
  return LANG_NAMES[code] || code;
}

export interface TranslateDto {
  projectId: string;
  key: string;
  translations: Record<string, string>;
}

@Injectable()
export class TranslateService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const apiKey = this.configService.get<string>('QWEN_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      });
    }
  }

  async translate(dto: TranslateDto) {
    if (!this.openai) {
      throw new BadRequestException('QWEN_API_KEY is not configured');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new BadRequestException('项目不存在');
    }

    const sourceLocale = project.sourceLocale;
    const sourceText = dto.translations[sourceLocale];
    if (!sourceText?.trim()) {
      throw new BadRequestException('源语言文本不能为空');
    }

    // 从项目配置获取目标语言
    const targetLangs = (project.targetLanguages as string[]) || [];

    if (targetLangs.length === 0) {
      return { translations: dto.translations };
    }

    const targetList = targetLangs.map((lang) => `"${lang}" (${getLangName(lang)})`).join(', ');

    const prompt = buildTranslatePrompt({
      sourceLang: getLangName(sourceLocale),
      sourceText,
      contextKey: dto.key,
      targetList,
    });
    const completion = await this.openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('AI 翻译返回为空');
    }

    const translated = JSON.parse(content) as Record<string, string>;

    // 合并：保留源语言原文 + AI 翻译结果
    const result: Record<string, string> = {
      [sourceLocale]: sourceText,
    };
    for (const lang of targetLangs) {
      result[lang] = translated[lang] || dto.translations[lang] || '';
    }

    return { translations: result };
  }
}
