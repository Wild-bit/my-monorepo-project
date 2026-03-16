import { httpClient } from '@/services/request';
import { CreateKeyRequest, KeyInfo, KeyListQuery, KeyListResponse } from './types';

/**
 * 获取国际化键列表
 */
export const getKeysListApi = (params: KeyListQuery) => {
  return httpClient.get<KeyListResponse>('/keys/list', {
    params: {
      projectId: params.projectId,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
    },
  });
};

/**
 * 创建国际化键
 */
export const createKeyApi = (data: CreateKeyRequest) => {
  return httpClient.post<KeyInfo>('/keys/create', data);
};

/**
 * 删除国际化键
 */
export const deleteKeyApi = (id: string) => {
  return httpClient.post('/keys/delete', { id });
};

/**
 * 编辑国际化键
 */
export const editKeyApi = (data: { id: string } & CreateKeyRequest) => {
  return httpClient.post<KeyInfo>('/keys/edit', data);
};

/**
 * AI 翻译
 */
export const aiTranslateApi = (data: {
  projectId: string;
  key: string;
  translations: Record<string, string>;
}) => {
  return httpClient.post<{ translations: Record<string, string> }>('/translate/ai', data);
};
