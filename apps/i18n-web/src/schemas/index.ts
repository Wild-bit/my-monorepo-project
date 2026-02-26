/**
 * 前端表单校验 Schema
 * 复用 shared 包中的 schema，按需扩展
 */

// 从 shared 包导入共享 schema
export {
  paginationSchema,
  userSchema,
  createUserSchema,
  updateUserSchema,
  type PaginationInput,
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from '@packages/shared';
