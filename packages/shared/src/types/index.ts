/**
 * 共享类型定义
 */

// API 响应统一结构
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

// API 错误响应结构
export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应结构
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 通用 ID 类型
export type ID = string;

// 时间戳字段
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}
