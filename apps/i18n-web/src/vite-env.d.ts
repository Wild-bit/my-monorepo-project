/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_ENV: 'development' | 'production' | 'staging';
  readonly VITE_ENABLE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
