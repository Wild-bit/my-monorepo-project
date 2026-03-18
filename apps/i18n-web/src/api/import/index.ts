import httpClient from '@/services/request';

export interface ImportFileData {
  lang: string;
  translations: Record<string, any>;
}

export interface ImportRequest {
  projectId: string;
  strategy: 'skip' | 'overwrite';
  files: ImportFileData[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
}

export const importJsonApi = (data: ImportRequest) => {
  return httpClient.post<ImportResult>('/import/json', data);
};
