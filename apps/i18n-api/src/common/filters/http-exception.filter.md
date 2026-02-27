# HttpExceptionFilter 文档

> 文件路径：`apps/i18n-api/src/common/filters/http-exception.filter.ts`

## 概述

`HttpExceptionFilter` 是一个 NestJS **全局异常过滤器**，用于统一捕获和处理应用中抛出的所有异常，并将其转换为标准化的 API 错误响应格式。

## 解决的问题

### 1. 异常响应格式不统一

**问题**：NestJS 默认的异常响应格式与前端约定的 `ApiErrorResponse` 格式不一致。

```json
// NestJS 默认格式
{
  "statusCode": 400,
  "message": "Bad Request"
}

// 我们需要的格式
{
  "success": false,
  "message": "请求参数错误",
  "code": "BAD_REQUEST",
  "errors": { ... }
}
```

### 2. 未捕获异常导致信息泄露

**问题**：未处理的异常可能暴露敏感的堆栈信息给客户端。

**解决**：使用 `@Catch()` 装饰器（无参数）捕获所有异常，统一返回安全的错误信息。

### 3. 参数校验错误格式不友好

**问题**：`class-validator` 返回的校验错误是字符串数组，不便于前端处理。

**解决**：将校验错误转换为结构化的 `errors` 对象。

## 核心功能

| 功能            | 说明                                     |
| --------------- | ---------------------------------------- |
| 统一响应格式    | 所有错误响应遵循 `ApiErrorResponse` 接口 |
| HTTP 状态码映射 | 自动根据状态码生成语义化的错误代码       |
| 校验错误格式化  | 将 class-validator 错误转换为结构化格式  |
| 安全兜底        | 未知异常返回通用错误信息，不暴露内部细节 |

## 响应格式

```typescript
interface ApiErrorResponse {
  success: false;
  message: string; // 用户可读的错误信息
  code: string; // 机器可读的错误代码
  errors?: Record<string, string[]>; // 详细错误（可选）
}
```

### 示例响应

**404 Not Found**

```json
{
  "success": false,
  "message": "用户不存在",
  "code": "NOT_FOUND"
}
```

**422 Validation Error**

```json
{
  "success": false,
  "message": "参数校验失败",
  "code": "VALIDATION_ERROR",
  "errors": {
    "validation": ["email 必须是有效的邮箱地址", "password 长度不能少于 6 位"]
  }
}
```

**500 Internal Error**

```json
{
  "success": false,
  "message": "服务器内部错误",
  "code": "INTERNAL_ERROR"
}
```

## 状态码映射表

| HTTP 状态码 | 错误代码           |
| ----------- | ------------------ |
| 400         | `BAD_REQUEST`      |
| 401         | `UNAUTHORIZED`     |
| 403         | `FORBIDDEN`        |
| 404         | `NOT_FOUND`        |
| 409         | `CONFLICT`         |
| 422         | `VALIDATION_ERROR` |
| 500         | `INTERNAL_ERROR`   |
| 其他        | `UNKNOWN_ERROR`    |

## 使用场景

### 场景 1：全局注册（推荐）

在 `main.ts` 中全局注册，所有异常自动被捕获：

```typescript
// main.ts
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  // ...
}
```

### 场景 2：业务代码抛出异常

在 Service 或 Controller 中抛出标准 HTTP 异常：

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

// 资源不存在
throw new NotFoundException('用户不存在');

// 请求参数错误
throw new BadRequestException('邮箱格式不正确');

// 自定义错误代码
throw new HttpException(
  { message: '余额不足', code: 'INSUFFICIENT_BALANCE' },
  HttpStatus.BAD_REQUEST
);
```

### 场景 3：配合 ValidationPipe 使用

当使用 `class-validator` 进行 DTO 校验时，校验失败会抛出 `BadRequestException`，过滤器会自动格式化错误信息：

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  })
);
```

## 与前端配合

前端 `httpClient` 可以统一处理错误响应：

```typescript
// 前端 request.ts
if (!response.ok) {
  const errorResponse = data as ApiErrorResponse;
  throw new HttpError(
    errorResponse.message,
    response.status,
    errorResponse.code,
    errorResponse.errors
  );
}
```

## 扩展建议

1. **日志记录**：在 `catch` 方法中添加日志，记录异常详情用于排查问题
2. **国际化**：根据请求的 `Accept-Language` 头返回多语言错误信息
3. **字段级错误**：改进 `formatValidationErrors` 方法，按字段名分组错误

## 相关文件

- `@packages/shared/src/types/index.ts` - `ApiErrorResponse` 类型定义
- `apps/i18n-api/src/main.ts` - 全局注册位置
- `apps/i18n-api/src/common/interceptors/transform.interceptor.ts` - 成功响应转换器
