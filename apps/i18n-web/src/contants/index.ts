export const USER_LOCAL_STORAGE_KEY = 'user_info';
export const TOKEN_LOCAL_STORAGE_KEY = 'token';
export const CURRENT_TEAM_SLUG_LOCAL_STORAGE_KEY = 'current_team_slug';

export const LOCALE_LABELS: Record<string, string> = {
  'zh-cn': '中文（简体）',
  'zh-tw': '中文（繁体）',
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

export const LOCALE_OPTIONS = [
  { value: 'zh-cn', label: '简体中文 (zh-CN)' },
  { value: 'zh-tw', label: '繁体中文 (zh-TW)' },
  { value: 'en', label: 'English (en)' },
  { value: 'ja', label: '日本語 (ja)' },
  { value: 'ko', label: '韩语 (ko)' },
  { value: 'fr', label: '法语 (fr)' },
  { value: 'de', label: '德语 (de)' },
  { value: 'es', label: '西班牙语 (es)' },
  { value: 'pt', label: '葡萄牙语 (pt)' },
  { value: 'it', label: '意大利语 (it)' },
  { value: 'ru', label: '俄语 (ru)' },
  { value: 'ar', label: '阿拉伯语 (ar)' },
  { value: 'th', label: '泰语 (th)' },
  { value: 'vi', label: '越南语 (vi)' },
  { value: 'id', label: '印尼语 (id)' },
  { value: 'ms', label: '马来语 (ms)' },
  { value: 'hi', label: '印地语 (hi)' },
  { value: 'tr', label: '土耳其语 (tr)' },
  { value: 'nl', label: '荷兰语 (nl)' },
  { value: 'pl', label: '波兰语 (pl)' },
  { value: 'sv', label: '瑞典语 (sv)' },
  { value: 'da', label: '丹麦语 (da)' },
  { value: 'no', label: '挪威语 (no)' },
  { value: 'fi', label: '芬兰语 (fi)' },
];

export function getLocaleLabel(code: string) {
  return LOCALE_LABELS[code] || code;
}
