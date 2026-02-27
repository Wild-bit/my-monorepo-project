# TransformInterceptor 文档

> 文件路径：`apps/i18n-api/src/common/interceptors/transform.interceptor.ts`

## 概述

`TransformInterceptor` 是一个 NestJS **响应拦截器**，用于将 Controller 返回的原始数据自动包装成统一的 `ApiResponse` 格式，确保所有成功响应具有一致的结构。

## 解决的问题

### 1. 响应格式不统一

**问题**：不同 Controller 返回的数据格式各异，前端需要针对每个接口单独处理。

```typescript
// 不统一的响应
// 接口 A 返回
{ "id": 1, "name": "张三" }

// 接口 B 返回
{ "user": { "id": 1 }, "token": "xxx" }

// 接口 C 返回
[{ "id": 1 }, { "id": 2 }]
```

**解决**：统一包装为标准格式。

```json
{
  "success": true,
  "data": { ... }
}
```

### 2. 业务代码重复包装

**问题**：每个 Controller 方法都需要手动包装响应。

```typescript
// 繁琐的写法
@Get()
findAll() {
  const users = this.userService.findAll();
  return { success: true, data: users };  // 每次都要写
}
```

**解决**：拦截器自动处理，Controller 只需返回业务数据。

```typescript
// 简洁的写法
@Get()
findAll() {
  return this.userService.findAll();  // 直接返回数据
}
```

### 3. 与错误响应格式对齐

**问题**：成功响应和错误响应格式需要保持一致，便于前端统一处理。

| 响应类型 | 处理者 | 格式 |
|----------|--------|------|
| 成功 | `TransformInterceptor` | `{ success: true, data: T }` |
| 失败 | `HttpExceptionFilter` | `{ success: false, message, code }` |

## 核心功能

| 功能 | 说明 |
|------|------|
| 自动包装 | 将任意返回值包装为 `ApiResponse<T>` |
| 泛型支持 | 保留原始数据的类型信息 |
| RxJS 集成 | 使用 `map` 操作符处理响应流 |

## 响应格式

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

### 转换示例

**Controller 返回**
```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  return { id: 1, name: '张三', email: 'zhang@example.com' };
}
```

**实际响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhang@example.com"
  }
}
```

**返回数组**
```typescript
@Get()
findAll() {
  return [{ id: 1 }, { id: 2 }];
}
```

```json
{
  "success": true,
  "data": [
    { "id": 1 },
    { "id": 2 }
  ]
}
```

**返回简单值**
```typescript
@Delete(':id')
remove(@Param('id') id: string) {
  return true;
}
```

```json
{
  "success": true,
  "data": true
}
```

## 使用场景

### 场景 1：全局注册（推荐）

在 `main.ts` 中全局注册，所有响应自动被转换：

```typescript
// main.ts
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformInterceptor());
  // ...
}
```

### 场景 2：模块级注册

在特定模块中注册，仅影响该模块的 Controller：

```typescript
// user.module.ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class UserModule {}
```

### 场景 3：Controller 级注册

仅对特定 Controller 生效：

```typescript
@Controller('users')
@UseInterceptors(TransformInterceptor)
export class UserController {
  // ...
}
```

## 工作原理

```
请求 → Controller → Service → 返回数据
                                    ↓
                            TransformInterceptor
                                    ↓
                            { success: true, data: 原始数据 }
                                    ↓
                                  响应
```

拦截器使用 RxJS 的 `map` 操作符，在响应发送前对数据进行转换：

```typescript
return next.handle().pipe(
  map((data) => ({
    success: true,
    data,
  }))
);
```

## 与前端配合

前端可以统一处理成功响应：

```typescript
// 前端 request.ts
async function fetcher<T>(url: string): Promise<T> {
  const response = await httpClient.get<T>(url);
  return response.data;  // 直接取 data 字段
}
```

## 注意事项

### 1. 不影响错误响应

拦截器只处理成功响应。当抛出异常时，会跳过拦截器，由 `HttpExceptionFilter` 处理。

### 2. 返回 `null` 或 `undefined`

如果 Controller 返回 `null` 或 `undefined`，也会被包装：

```json
{
  "success": true,
  "data": null
}
```

### 3. 文件下载等特殊响应

对于流式响应（如文件下载），需要跳过拦截器或单独处理。

## 扩展建议

1. **添加 message 字段**：支持返回成功提示信息

```typescript
map((data) => ({
  success: true,
  data,
  message: '操作成功',
}))
```

2. **分页响应**：识别分页数据，添加分页元信息

3. **响应时间**：添加 `timestamp` 或 `duration` 字段用于监控

## 相关文件

- `@packages/shared/src/types/index.ts` - `ApiResponse` 类型定义
- `apps/i18n-api/src/main.ts` - 全局注册位置
- `apps/i18n-api/src/common/filters/http-exception.filter.ts` - 错误响应处理器
