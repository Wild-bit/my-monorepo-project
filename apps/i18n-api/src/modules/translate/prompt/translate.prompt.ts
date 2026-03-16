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
  return `你是一位专业的国际化翻译专家。请将以下${sourceLang}文本翻译为目标语言。原文（${sourceLang}）："${sourceText}"，上下文 Key：「${contextKey}」，目标语言：${targetList}，翻译规则：- 翻译应自然、简洁，符合软件 UI 文案习惯，保持语义准确，不要过度意译，保留变量占位符，如 {name}、{{count}}、%s、%d 等，不要翻译，如果包含 HTML 标签，请原样保留，不要添加任何解释说明，只返回 JSON，请返回一个 JSON 对象，以语言代码为 key，翻译后的文本为 value。示例：{"en": "Hello", "ja": "こんにちは"}`;
}
