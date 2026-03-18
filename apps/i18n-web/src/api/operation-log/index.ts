import httpClient from '@/services/request';
import { PaginatedResponse, PaginationParams } from '@packages/shared';
import { OperationLogItem } from './types';

export const getOperationLogListApi = (params: PaginationParams & { projectId: string }) => {
  return httpClient.get<PaginatedResponse<OperationLogItem>>('/operation-log/list', {
    params: {
      projectId: params.projectId,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
};
