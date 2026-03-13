import httpClient from '@/services/request';
import {
  AcceptInviteResult,
  CreateInviteLinkRequest,
  CreateProjectRequest,
  CreateTeamRequest,
  EditTeamRequest,
  InviteLinkInfo,
  InviteValidateResult,
  ProjectInfo,
  TeamInfo,
  TeamListResponse,
  TeamMemberInfo,
} from './types';
import { PaginatedResponse, PaginationParams } from '@packages/shared';

export const getTeamListApi = () => {
  return httpClient.get<TeamListResponse>('/teams', {
    params: {
      page: 1,
      pageSize: 100,
    },
  });
};

export const getTeamBySlugApi = (teamSlug: string) => {
  return httpClient.get<TeamInfo>(`/teams/${teamSlug}`);
};

export const editTeamInfoApi = (data: EditTeamRequest) => {
  return httpClient.post<TeamInfo>(`/teams/${data.id}`, data);
};

export const createTeamApi = (data: CreateTeamRequest) => {
  return httpClient.post<TeamInfo>('/teams', data);
};

export const getProjectBySlugApi = (teamSlug: string, projectSlug: string) => {
  return httpClient.get<ProjectInfo>(`/projects/project-by-slug`, {
    params: {
      teamSlug,
      slug: projectSlug,
    },
  });
};

export const getProjectListApi = (params: PaginationParams & { teamSlug: string }) => {
  return httpClient.get<PaginatedResponse<ProjectInfo>>('/projects/list', {
    params: {
      teamSlug: params.teamSlug,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
};

export const createProjectApi = (data: CreateProjectRequest) => {
  return httpClient.post<ProjectInfo>('/projects/create', data);
};

export const getTeamMembersApi = (teamId: string) => {
  return httpClient.get<TeamMemberInfo[]>(`/team-members/list`, {
    params: {
      teamId,
    },
  });
};

export const updateMemberRoleApi = (id: string, role: string) => {
  return httpClient.post('/team-members/role', { id, role });
};

export const removeMemberApi = (id: string) => {
  return httpClient.post('/team-members/remove', { id });
};

export const createInviteLinkApi = (data: CreateInviteLinkRequest) => {
  return httpClient.post<InviteLinkInfo>('/invite/create', data);
};

export const getInviteLinksApi = (params: PaginationParams & { teamId: string }) => {
  return httpClient.get<PaginatedResponse<InviteLinkInfo>>('/invite/list', {
    params: {
      teamId: params.teamId,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
};

export const revokeInviteLinkApi = (id: string) => {
  return httpClient.post(`/invite/revoke/${id}`, {});
};

export const validateInviteTokenApi = (token: string) => {
  return httpClient.get<InviteValidateResult>('/invite/validate', {
    params: { token },
  });
};

export const acceptInviteApi = (token: string) => {
  return httpClient.post<AcceptInviteResult>('/invite/accept', { token });
};
