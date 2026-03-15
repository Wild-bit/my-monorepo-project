/**
 * AI 翻译 Prompt 模板
 *
 * 变量说明：
 * - sourceLang: 源语言名称
 * - sourceText: 源语言文本
 * - contextKey: 国际化 Key 名称，提供翻译上下文
 * - targetList: 目标语言列表，格式如 "en" (英语), "ja" (日语)
 *
 * 返回格式：
 * JSON 对象，语言代码为 key，翻译文本为 value
 * 示例：{"en": "Hello", "ja": "こんにちは"}
 */

export interface TranslatePromptParams {
  sourceLang: string;
  sourceText: string;
  contextKey: string;
  targetList: string;
}

export function buildTranslatePrompt({
  sourceLang,
  sourceText,
  contextKey,
  targetList,
}: TranslatePromptParams): string {
  return `你是一位专业的国际化翻译专家。请将以下${sourceLang}文本翻译为目标语言。

原文（${sourceLang}）："${sourceText}"
上下文 Key：「${contextKey}」

目标语言：${targetList}

翻译规则：
- 翻译应自然流畅，符合目标语言的表达习惯
- 保留变量占位符，如 {name}、{{count}}、%s、%d 等，不要翻译
- 如果包含 HTML 标签，请原样保留
- 不要添加任何解释说明，只返回 JSON

请返回一个 JSON 对象，以语言代码为 key，翻译后的文本为 value。示例：
{"en": "Hello", "ja": "こんにちは"}`;
}
