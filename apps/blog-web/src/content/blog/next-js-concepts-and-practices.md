# Next.js 相关概念与实践指南

## 渲染模式概览

### 什么是渲染？

渲染是将 React 组件转换为用户可见的 HTML 的过程。Next.js 提供了多种渲染策略，每种都有不同的执行时机和适用场景。

### 四种主要渲染模式

| 渲染模式     | 缩写 | 执行时机          | HTML 生成位置         | 数据新鲜度 |
| ------------ | ---- | ----------------- | --------------------- | ---------- |
| 客户端渲染   | CSR  | 浏览器运行时      | 浏览器                | 实时       |
| 静态站点生成 | SSG  | 构建时            | 服务器（构建时）      | 构建时数据 |
| 服务端渲染   | SSR  | 每次请求时        | 服务器（请求时）      | 实时       |
| 增量静态再生 | ISR  | 构建时 + 定期更新 | 服务器（构建 + 后台） | 定期更新   |

### 渲染时机对比

```
CSR (客户端渲染):
用户请求 → 返回空 HTML + JS → 浏览器执行 JS → 渲染页面
优点: 交互性强，服务器压力小
缺点: 首屏慢，SEO 差

SSG (静态生成):
构建时生成 HTML → 用户请求 → 直接返回静态 HTML
优点: 最快，SEO 最佳，CDN 友好
缺点: 数据不实时，大量页面构建慢

SSR (服务端渲染):
用户请求 → 服务器获取数据 → 生成 HTML → 返回完整 HTML
优点: 数据实时，SEO 好
缺点: 响应较慢，服务器压力大

ISR (增量静态再生):
构建时生成 HTML → 用户请求 → 返回缓存 HTML → 后台更新
优点: 快速 + 数据相对新鲜
缺点: 数据有延迟，实现复杂
```

---

## SSG - 静态站点生成

**SSG (Static Site Generation)** 就是静态站点，在构建的时候预先生成所有应用的HTML文件。 这些静态文件可以部署到CDN，为用户提供最快的加载速度。
另外 CSS 也是在构建阶段处理的，每个HTML 只会加载这个需要用到的CSS文件，不会整个网站的CSS一次性加载。

### 工作原理

```
npm run build
  ↓
Node 执行 getStaticProps
  ↓
获取数据（JSON）
  ↓
React 组件接收 props
  ↓
生成虚拟 DOM
  ↓
renderToString → HTML字符串
  ↓
写入 .html 文件
  ↓
部署到 CDN
    ↓
用户请求 → 直接返回静态 HTML
```

### 基础用法

```typescript
// pages/blog.tsx
import type { GetStaticProps } from 'next'

interface Post {
  id: string
  title: string
  content: string
}

interface BlogProps {
  posts: Post[]
}

// 这个函数在构建时执行
export const getStaticProps: GetStaticProps<BlogProps> = async () => {
  // 从 API 获取数据
  const res = await fetch('https://api.example.com/posts')
  const posts: Post[] = await res.json()

  return {
    props: {
      posts,
    },
  }
}

// 页面组件接收 props
export default function Blog({ posts }: BlogProps) {
  return (
    <div>
      <h1>博客文章</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

### 动态路由 SSG

对于动态路由（如 `/blog/[slug]`），需要使用 `getStaticPaths` 告诉 Next.js 要生成哪些页面。

```typescript
// pages/blog/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from 'next'

interface Post {
  slug: string
  title: string
  content: string
}

// 1. 告诉 Next.js 要生成哪些路径
export const getStaticPaths: GetStaticPaths = async () => {
  // 获取所有文章的 slug
  const res = await fetch('https://api.example.com/posts')
  const posts: Post[] = await res.json()

  // 生成路径数组
  const paths = posts.map(post => ({
    params: { slug: post.slug },
  }))

  return {
    paths,
    fallback: false, // 404 for paths not returned
  }
}

// 2. 为每个路径获取数据
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string
  const res = await fetch(`https://api.example.com/posts/${slug}`)
  const post: Post = await res.json()

  return {
    props: {
      post,
    },
  }
}

export default function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

> APP Router 模式可以不需要使用 **getStaticProps** 获取 数据 可以直接在组件中使用fetch 获取数据，默认就是 Server Component

### fallback 选项详解

`getStaticPaths` 的 `fallback` 参数控制未预生成页面的行为：

```typescript
return {
  paths: [...],
  fallback: false | true | 'blocking'
}
```

| fallback 值  | 行为                                        | 适用场景               |
| ------------ | ------------------------------------------- | ---------------------- |
| `false`      | 未预生成的路径返回 404                      | 页面数量少，全部预生成 |
| `true`       | 首次请求时显示 fallback 页面，后台生成 HTML | 页面数量多，按需生成   |
| `'blocking'` | 首次请求时等待生成完成再返回                | 不想显示 loading 状态  |

**fallback: true 示例：**

```typescript
export default function BlogPost({ post }: { post?: Post }) {
  const router = useRouter()

  // 如果页面还在生成中
  if (router.isFallback) {
    return <div>加载中...</div>
  }

  return (
    <article>
      <h1>{post!.title}</h1>
      <div>{post!.content}</div>
    </article>
  )
}
```

### 优势与劣势

**优势：**

- ⚡ 性能最佳：静态文件，无需服务器计算
- 🌍 CDN 友好：可部署到全球 CDN
- 💰 成本低：无需服务器持续运行
- 🔍 SEO 最佳：完整的 HTML，爬虫友好

**劣势：**

- 📅 数据不实时：显示构建时的数据
- ⏱️ 构建时间长：大量页面时构建慢
- 🔄 更新麻烦：数据变化需要重新构建

**适用场景：**

- 博客、文档网站
- 营销页面、落地页
- 产品展示页
- 不经常变化的内容

---

## SSR - 服务端渲染

### 核心概念

**SSR (Server-Side Rendering)** 在**每次请求时**在服务器端生成 HTML。这确保用户始终看到最新的数据，同时保持良好的 SEO。

### 工作原理

```
用户请求页面
    ↓
服务器执行 getServerSideProps
    ↓
获取最新数据（API、数据库）
    ↓
服务器渲染 React 组件为 HTML
    ↓
返回完整 HTML 给浏览器
    ↓
浏览器显示页面（首屏快）
    ↓
下载 JavaScript
    ↓
Hydration（页面变为可交互）
```

### 基础用法

```typescript
// pages/dashboard.tsx
import type { GetServerSideProps } from 'next'

interface User {
  id: string
  name: string
  email: string
}

interface DashboardProps {
  user: User
  timestamp: string
}

// 这个函数在每次请求时执行
export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
  // 可以访问请求对象
  const { req, res, query, params } = context

  // 获取实时数据
  const res = await fetch('https://api.example.com/user', {
    headers: {
      // 可以转发 cookies
      cookie: req.headers.cookie || '',
    },
  })
  const user: User = await res.json()

  return {
    props: {
      user,
      timestamp: new Date().toISOString(),
    },
  }
}

export default function Dashboard({ user, timestamp }: DashboardProps) {
  return (
    <div>
      <h1>欢迎，{user.name}</h1>
      <p>邮箱：{user.email}</p>
      <p>页面生成时间：{timestamp}</p>
    </div>
  )
}
```

### Context 参数详解

`getServerSideProps` 接收一个 context 对象，包含丰富的请求信息：

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const {
    req, // HTTP 请求对象（IncomingMessage）
    res, // HTTP 响应对象（ServerResponse）
    params, // 动态路由参数，如 { id: '123' }
    query, // 查询字符串参数，如 { search: 'keyword' }
    preview, // 预览模式（已废弃，使用 draftMode）
    previewData, // 预览数据（已废弃）
    draftMode, // 草稿模式
    resolvedUrl, // 规范化的请求 URL
    locale, // 当前语言（i18n）
    locales, // 所有支持的语言
    defaultLocale, // 默认语言
  } = context;

  // 示例：根据查询参数获取数据
  const page = query.page || '1';
  const data = await fetchData(page);

  return { props: { data } };
};
```

### 高级用法

**1. 重定向：**

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getUser(context.req);

  // 未登录用户重定向到登录页
  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false, // 临时重定向（307）
      },
    };
  }

  return {
    props: { user },
  };
};
```

**2. 返回 404：**

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const post = await getPost(context.params?.id as string);

  // 文章不存在，返回 404
  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: { post },
  };
};
```

**3. 设置响应头：**

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const data = await fetchData();

  // 设置缓存头
  context.res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');

  return {
    props: { data },
  };
};
```

**4. 访问 Cookies：**

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  // 读取 cookie
  const token = context.req.cookies.token;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const user = await verifyToken(token);

  return {
    props: { user },
  };
};
```

### 优势与劣势

**优势：**

- 🔄 数据实时：每次请求都获取最新数据
- 🔐 安全：可以访问服务器资源（数据库、API 密钥）
- 🔍 SEO 友好：完整的 HTML，爬虫可见
- 👤 个性化：可以根据用户、请求定制内容

**劣势：**

- 🐌 响应较慢：每次请求都需要服务器计算
- 💰 成本高：需要服务器持续运行
- 📈 扩展性：服务器负载随流量增加
- 🌍 地理延迟：用户距离服务器越远越慢

**适用场景：**

- 用户仪表板、个人中心
- 需要认证的页面
- 实时数据展示（股票、天气）
- 个性化推荐内容

---

## ISR - 增量静态再生

### 核心概念

**ISR (Incremental Static Regeneration)** 是 SSG 和 SSR 的完美结合，在**构建时生成静态页面**，然后在**后台定期更新**。这样既保证了性能，又能保持数据相对新鲜。

### 工作原理

```
构建时：
npm run build → 生成初始静态 HTML

用户请求（revalidate 时间内）：
用户请求 → 返回缓存的静态 HTML（快！）

用户请求（超过 revalidate 时间）：
用户请求 → 返回旧的缓存 HTML（仍然快！）
         ↓
    后台触发重新生成
         ↓
    获取最新数据
         ↓
    生成新的 HTML
         ↓
    替换旧缓存
         ↓
下次请求返回新 HTML
```

### 基础用法

只需在 `getStaticProps` 中添加 `revalidate` 参数：

```typescript
// pages/products/[id].tsx
import type { GetStaticProps, GetStaticPaths } from 'next'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

export const getStaticPaths: GetStaticPaths = async () => {
  // 只预生成热门产品
  const popularProducts = await fetchPopularProducts()

  const paths = popularProducts.map(product => ({
    params: { id: product.id },
  }))

  return {
    paths,
    fallback: 'blocking', // 其他产品按需生成
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const product = await fetchProduct(params?.id as string)

  if (!product) {
    return { notFound: true }
  }

  return {
    props: { product },
    // 关键：每 60 秒重新验证一次
    revalidate: 60,
  }
}

export default function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>价格：¥{product.price}</p>
      <p>库存：{product.stock}</p>
    </div>
  )
}
```

### revalidate 时间选择

选择合适的 `revalidate` 值很重要：

| revalidate 值 | 更新频率 | 适用场景                     |
| ------------- | -------- | ---------------------------- |
| 1             | 每秒     | 实时性要求高（但考虑用 SSR） |
| 10            | 每 10 秒 | 快速变化的内容（新闻）       |
| 60            | 每分钟   | 中等频率更新（产品价格）     |
| 3600          | 每小时   | 低频更新（博客文章）         |
| 86400         | 每天     | 很少变化（文档）             |

### On-Demand ISR（按需重新验证）

Next.js 12.2+ 支持手动触发页面重新生成，无需等待 `revalidate` 时间：

```typescript
// pages/api/revalidate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 验证请求（防止滥用）
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    // 重新生成指定路径
    await res.revalidate('/products/123');
    await res.revalidate('/blog/my-post');

    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
```

**使用场景：**

- 内容管理系统（CMS）发布新文章时触发
- 产品库存更新时立即刷新
- 用户编辑内容后立即更新

**触发方式：**

```bash
# Webhook 或手动触发
curl https://your-site.com/api/revalidate?secret=YOUR_SECRET
```

### ISR 与 SSG 的区别

```typescript
// 纯 SSG - 构建后永不更新
export const getStaticProps: GetStaticProps = async () => {
  const data = await fetchData();
  return { props: { data } };
};

// ISR - 定期自动更新
export const getStaticProps: GetStaticProps = async () => {
  const data = await fetchData();
  return {
    props: { data },
    revalidate: 60, // 每 60 秒更新
  };
};
```

### 优势与劣势

**优势：**

- ⚡ 性能好：大部分请求返回缓存（快）
- 🔄 数据相对新鲜：定期后台更新
- 💰 成本适中：比 SSR 便宜，比 SSG 灵活
- 📈 可扩展：静态文件 + CDN
- 🎯 按需生成：不需要预生成所有页面

**劣势：**

- ⏱️ 数据有延迟：不是实时的
- 🔧 复杂度高：需要理解缓存机制
- 🐛 调试困难：缓存问题不易排查
- 💾 缓存管理：需要考虑缓存失效策略

**适用场景：**

- 电商产品页（价格、库存定期更新）
- 新闻网站（文章定期发布）
- 博客（评论数、点赞数更新）
- API 文档（定期更新）

### 最佳实践

1. **合理设置 revalidate 时间**

   ```typescript
   // 根据数据更新频率设置
   return {
     props: { data },
     revalidate: 60, // 不要设置太短（增加服务器负载）
   };
   ```

2. **使用 fallback: 'blocking' 处理未生成页面**

   ```typescript
   return {
     paths: popularPaths,
     fallback: 'blocking', // 首次访问时生成，后续使用 ISR
   };
   ```

3. **结合 On-Demand ISR**

   ```typescript
   // 定期更新 + 手动触发
   return {
     props: { data },
     revalidate: 3600, // 兜底：每小时更新
   };
   // + API 路由手动触发重新验证
   ```

4. **监控重新生成**
   ```typescript
   export const getStaticProps: GetStaticProps = async () => {
     console.log('Regenerating page at', new Date().toISOString());
     const data = await fetchData();
     return { props: { data }, revalidate: 60 };
   };
   ```

---

## 数据获取方法详解

### Pages Router 数据获取方法

Next.js Pages Router 提供了三个主要的数据获取函数：

| 函数                 | 执行时机 | 运行环境 | 数据新鲜度 | 性能 | 使用场景     |
| -------------------- | -------- | -------- | ---------- | ---- | ------------ |
| `getStaticProps`     | 构建时   | 服务器   | 构建时数据 | 最快 | 静态内容     |
| `getStaticPaths`     | 构建时   | 服务器   | -          | -    | 动态路由 SSG |
| `getServerSideProps` | 每次请求 | 服务器   | 实时       | 较慢 | 动态内容     |

### getStaticProps 详解

**特点：**

- 只在构建时执行一次
- 只在服务器端运行，永远不会在客户端运行
- 可以直接访问文件系统、数据库
- 代码不会被打包到客户端 bundle

**返回值选项：**

```typescript
export const getStaticProps: GetStaticProps = async (context) => {
  return {
    // 1. 返回 props
    props: { data },

    // 2. 启用 ISR（可选）
    revalidate: 60,

    // 3. 返回 404（可选）
    notFound: true,

    // 4. 重定向（可选）
    redirect: {
      destination: '/other-page',
      permanent: false,
    },
  };
};
```

### getStaticPaths 详解

**用途：** 为动态路由指定要预渲染的路径。

```typescript
// pages/posts/[id].tsx
export const getStaticPaths: GetStaticPaths = async () => {
  // 获取所有文章 ID
  const posts = await getAllPosts();

  return {
    // 指定要预生成的路径
    paths: posts.map((post) => ({
      params: { id: post.id },
    })),

    // fallback 行为
    fallback: false | true | 'blocking',
  };
};
```

### getServerSideProps 详解

**特点：**

- 每次请求都执行
- 只在服务器端运行
- 可以访问请求对象（req, res）
- 阻塞渲染，直到数据获取完成

**Context 参数：**

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  const {
    req, // HTTP IncomingMessage
    res, // HTTP ServerResponse
    params, // 路由参数 { id: '123' }
    query, // 查询参数 { search: 'keyword' }
    preview, // 预览模式（已废弃）
    previewData, // 预览数据（已废弃）
    draftMode, // 草稿模式
    resolvedUrl, // 规范化的 URL
    locale, // 当前语言
    locales, // 所有语言
    defaultLocale, // 默认语言
  } = context;

  return { props: { data } };
};
```

### App Router 数据获取（Next.js 13+）

Next.js 13 引入了 App Router，数据获取方式发生了重大变化：

**Server Components（默认）：**

```typescript
// app/posts/page.tsx
// 这是一个 Server Component，默认在服务器端渲染
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    // 缓存选项
    cache: 'force-cache',      // 默认：SSG 行为
    // cache: 'no-store',      // SSR 行为
    // next: { revalidate: 60 } // ISR 行为
  })
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
```

**缓存策略对比：**

```typescript
// SSG（静态生成）
fetch(url, { cache: 'force-cache' });

// SSR（服务端渲染）
fetch(url, { cache: 'no-store' });

// ISR（增量静态再生）
fetch(url, { next: { revalidate: 60 } });
```

### Pages Router vs App Router 对比

| 功能     | Pages Router          | App Router              |
| -------- | --------------------- | ----------------------- |
| 数据获取 | `getStaticProps`      | `fetch` with `cache`    |
| 动态路由 | `getStaticPaths`      | `generateStaticParams`  |
| SSR      | `getServerSideProps`  | `fetch` with `no-store` |
| ISR      | `revalidate` in props | `next: { revalidate }`  |
| 默认行为 | 客户端组件            | 服务端组件              |

---

## Hydration - 水合机制

### 核心概念

**Hydration（水合）** 是指将服务器生成的静态 HTML "注入生命力" 的过程。服务器发送完整的 HTML，浏览器立即显示，然后 React 接管并添加交互性。

### 为什么需要 Hydration？

```
传统 CSR（客户端渲染）：
浏览器收到空 HTML → 下载 JS → 执行 JS → 渲染页面
问题：首屏慢，SEO 差

SSR + Hydration：
浏览器收到完整 HTML → 立即显示（快！）→ 下载 JS → Hydration → 可交互
优势：首屏快，SEO 好，用户体验佳
```

## Hydration 工作流程

```
1. 服务器端（SSR/SSG）：
   ┌─────────────────────┐
   │ 执行 React 组件      │
   │ 调用 renderToString │
   │ 生成 HTML 字符串     │
   └─────────────────────┘
            ↓
   发送完整 HTML 到浏览器

2. 浏览器端：
   ┌─────────────────────┐
   │ 接收 HTML           │ ← 用户立即看到内容（首屏快！）
   └─────────────────────┘
            ↓
   ┌─────────────────────┐
   │ 下载 JavaScript     │
   └─────────────────────┘
            ↓
   ┌─────────────────────┐
   │ React Hydration     │ ← React "接管" HTML
   │ - 创建虚拟 DOM      │
   │ - 对比现有 HTML     │
   │ - 绑定事件监听器    │
   └─────────────────────┘
            ↓
   ┌─────────────────────┐
   │ 页面变为可交互       │ ← 按钮可点击，表单可输入
   └─────────────────────┘
```

> 服务端返回 HTML 后，浏览器加载 JS bundle，React 会重新执行组件生成虚拟 DOM，并与已有 DOM 对齐，在复用 DOM 的基础上绑定事件监听器，这个过程就是 hydration。
