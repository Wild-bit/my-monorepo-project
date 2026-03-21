# 深入理解 React Server Components

## 引言

React Server Components（RSC）是 React 18 引入的一项重要特性，它允许组件在服务器端渲染，从而带来更好的性能和用户体验。

## 什么是 Server Components？

Server Components 是一种在服务器上运行的 React 组件，它们：

- 只在服务器端执行，不会被打包到客户端 JavaScript 中
- 可以直接访问后端资源（数据库、文件系统）
- 可以享受服务器环境的完整能力

### 客户端组件 vs 服务端组件

| 特性        | 服务端组件  | 客户端组件 |
| ----------- | ----------- | ---------- |
| 执行环境    | 服务器      | 浏览器     |
| bundle 大小 | 零          | 有         |
| 数据获取    | 直接访问 DB | 通过 API   |
| 交互性      | 无          | 有         |

## 工作原理

### 服务端渲染流程

```
1. 用户请求页面
2. 服务器接收请求
3. RSC 组件在服务器执行
4. 生成 RSC Payload
5. React 客户端处理 Payload
6. 水合并渲染页面
```

### RSC Payload 结构

RSC 返回一种特殊格式的数据，包含组件类型和 props：

```javascript
// 简化的 RSC Payload 示例
{
  module: './BlogPost.js',
  props: { id: '123', title: '深入理解 RSC' }
}
```

## 使用场景

### 适合使用 RSC 的场景

1. **数据密集型页面**：需要从数据库获取大量数据的页面
2. **内容渲染型组件**：如博客文章、产品详情页
3. **大型依赖**：如 Markdown 解析器、语法高亮库

### 不适合使用 RSC 的场景

1. **需要交互**：使用了 useState、useEffect 等 hooks
2. **依赖浏览器 API**：如 localStorage、window
3. **实时更新**：需要 WebSocket 或 SSE 的场景

## 实践指南

### 基本用法

```jsx
// app/BlogPost.jsx (Server Component)
async function BlogPost({ id }) {
  const post = await db.posts.find(id);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### 混用策略

```jsx
// 父组件 - 服务端
async function Page() {
  const data = await fetchData();

  return (
    <div>
      <ServerComponent data={data} />
      <ClientComponent /> {/* 客户端组件 */}
    </div>
  );
}
```

## 性能优化

### 1. 减少客户端组件

将尽可能多的组件保持在服务端，只在必要时使用 `'use client'` 指令。

### 2. 合理的数据获取

在服务端组件中直接获取数据，避免不必要的 API 调用：

```jsx
// 好的做法
async function ProductPage({ id }) {
  const product = await db.products.find(id);
  return <ProductDetail product={product} />;
}

// 避免这样
async function ProductPage({ id }) {
  const product = await fetch(`/api/products/${id}`).then((r) => r.json());
  return <ProductDetail product={product} />;
}
```

### 3. 流式渲染

使用 Suspense 实现流式渲染，提升首屏加载体验：

```jsx
import { Suspense } from 'react';

function Page() {
  return (
    <div>
      <h1>产品列表</h1>
      <Suspense fallback={<Loading />}>
        <ProductList />
      </Suspense>
    </div>
  );
}
```

## 总结

React Server Components 代表了 React 开发的未来方向。通过合理使用 RSC，我们可以显著提升应用的性能和用户体验。
