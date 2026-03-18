import { env } from '@/config';
import { getToken } from '@/services/request';

export const exportJsonZipApi = async (projectId: string) => {
  const response = await fetch(`${env.apiBaseUrl}/export/json-zip?projectId=${projectId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('导出失败');
  }

  return response.blob();
};
