// SSG 完整示例 - 博客文章列表
import type { GetStaticProps } from 'next'

interface Post {
  id: string
  title: string
  excerpt: string
  date: string
}

interface BlogProps {
  posts: Post[]
}

// 构建时执行，生成静态 HTML
export const getStaticProps: GetStaticProps<BlogProps> = async () => {
  // 从 API 或文件系统获取数据
  const res = await fetch('https://api.example.com/posts')
  const posts: Post[] = await res.json()

  return {
    props: {
      posts,
    },
  }
}

export default function Blog({ posts }: BlogProps) {
  return (
    <div>
      <h1>博客文章</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <time>{post.date}</time>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 优势：
// - 构建时生成，性能最佳
// - 可部署到 CDN
// - SEO 友好
//
// 适用场景：
// - 博客列表
// - 文档页面
// - 营销页面
