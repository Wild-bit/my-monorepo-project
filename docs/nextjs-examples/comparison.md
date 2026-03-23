# Next.js 渲染模式对比

## 三种模式并排对比

### SSG vs ISR vs SSR

| 特性 | SSG | ISR | SSR |
|------|-----|-----|-----|
| **执行时机** | 构建时 | 构建时 + 定期更新 | 每次请求 |
| **HTML 生成** | 构建时一次性生成 | 构建时生成，后台更新 | 每次请求时生成 |
| **数据新鲜度** | 构建时数据 | 定期更新（如每 60 秒） | 实时数据 |
| **响应速度** | ⚡ 最快（静态文件） | ⚡ 快（缓存） | 🐢 较慢（需计算） |
| **服务器负载** | ⭐ 无（静态文件） | 🟡 低（定期更新） | ❌ 高（每次请求） |
| **CDN 友好** | ✅ 完美 | ✅ 很好 | 🟡 需配置 |
| **成本** | ⭐ 最低 | 🟡 中等 | ❌ 最高 |
| **SEO** | ⭐ 最佳 | ⭐ 最佳 | ⭐ 最佳 |
| **个性化** | ❌ 不支持 | ❌ 不支持 | ✅ 支持 |
| **构建时间** | 🟡 页面多时长 | 🟡 页面多时长 | ⭐ 无需构建 |

## 代码对比

### SSG 示例

```typescript
// pages/blog.tsx
export const getStaticProps: GetStaticProps = async () => {
  const posts = await fetchPosts()
  return { props: { posts } }
}
```

**特点：**
- 构建时执行一次
- 生成静态 HTML
- 部署后不会更新

### ISR 示例

```typescript
// pages/blog.tsx
export const getStaticProps: GetStaticProps = async () => {
  const posts = await fetchPosts()
  return {
    props: { posts },
    revalidate: 60, // 每 60 秒更新
  }
}
```

**特点：**
- 构建时执行一次
- 每 60 秒后台更新
- 用户仍然看到缓存（快）

### SSR 示例

```typescript
// pages/dashboard.tsx
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const user = await getUser(req)
  return { props: { user } }
}
```

**特点：**
- 每次请求执行
- 数据实时
- 可访问请求上下文

## 性能对比

### 首次加载（TTFB）

```
SSG:  ████ 50ms   (最快)
ISR:  █████ 60ms  (快)
SSR:  ████████████ 200ms (慢)
CSR:  ██████ 80ms (快，但内容为空)
```

### 首次内容绘制（FCP）

```
SSG:  ████ 100ms  (最快)
ISR:  █████ 120ms (快)
SSR:  ██████ 150ms (快)
CSR:  ████████████████ 500ms (慢)
```

### 可交互时间（TTI）

```
SSG:  ██████ 300ms (快)
ISR:  ██████ 300ms (快)
SSR:  ██████ 300ms (快)
CSR:  ████████████████████ 1000ms (慢)
```

## 使用场景决策

### 选择 SSG 的场景

✅ **适合：**
- 博客文章
- 文档网站
- 营销页面
- 产品展示页
- 关于我们页面

❌ **不适合：**
- 用户仪表板
- 实时数据
- 个性化内容
- 频繁变化的数据

### 选择 ISR 的场景

✅ **适合：**
- 电商产品页
- 新闻文章
- 社交媒体帖子
- API 文档
- 评论区（定期更新）

❌ **不适合：**
- 秒级实时数据
- 用户个人信息
- 需要认证的内容

### 选择 SSR 的场景

✅ **适合：**
- 用户仪表板
- 个人中心
- 购物车
- 搜索结果页
- 需要认证的页面

❌ **不适合：**
- 静态内容
- 高流量页面（成本高）
- 不需要实时的数据

## 混合使用策略

一个网站通常会混合使用多种渲染模式：

```typescript
// 首页 - SSG（静态内容）
// pages/index.tsx
export const getStaticProps = async () => {
  const featured = await getFeaturedProducts()
  return { props: { featured } }
}

// 产品列表 - ISR（定期更新）
// pages/products/index.tsx
export const getStaticProps = async () => {
  const products = await getAllProducts()
  return {
    props: { products },
    revalidate: 300, // 5 分钟
  }
}

// 产品详情 - ISR（按需生成）
// pages/products/[id].tsx
export const getStaticProps = async ({ params }) => {
  const product = await getProduct(params.id)
  return {
    props: { product },
    revalidate: 60, // 1 分钟
  }
}

export const getStaticPaths = async () => {
  const popular = await getPopularProducts()
  return {
    paths: popular.map(p => ({ params: { id: p.id } })),
    fallback: 'blocking', // 其他产品按需生成
  }
}

// 购物车 - SSR（个性化）
// pages/cart.tsx
export const getServerSideProps = async ({ req }) => {
  const user = await getUser(req)
  const cart = await getCart(user.id)
  return { props: { cart } }
}
```

## 成本对比

假设网站每月 100 万次访问：

| 模式 | 服务器成本 | CDN 成本 | 总成本 | 说明 |
|------|-----------|---------|--------|------|
| SSG | $0 | $10 | **$10** | 纯静态文件 |
| ISR | $20 | $10 | **$30** | 定期后台更新 |
| SSR | $200 | $50 | **$250** | 每次请求计算 |
| CSR | $0 | $10 | **$10** | 但 SEO 差 |

## 总结

**性能排序：** SSG > ISR > SSR > CSR
**数据新鲜度：** SSR = CSR > ISR > SSG
**成本排序：** SSG = CSR < ISR < SSR
**SEO 排序：** SSG = ISR = SSR > CSR

**推荐策略：**
1. 默认使用 SSG
2. 需要定期更新时使用 ISR
3. 需要实时/个性化时使用 SSR
4. 极度实时的内容使用 CSR + API
