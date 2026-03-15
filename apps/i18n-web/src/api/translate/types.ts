import { PaginatedResponse, PaginationParams } from '@packages/shared';

export interface TranslationItem {
  id: string;
  text: string;
  lang: string;
}

export interface KeyInfo {
  id: string;
  projectId: string;
  key: string;
  description: string;
  translations: TranslationItem[];
}

export interface CreateKeyRequest {
  projectId: string;
  key: string;
  description?: string;
  translations: Record<string, string>;
}

export type KeyListResponse = PaginatedResponse<KeyInfo>;

export interface KeyListQuery extends PaginationParams {
  projectId: string;
  search?: string;
}
