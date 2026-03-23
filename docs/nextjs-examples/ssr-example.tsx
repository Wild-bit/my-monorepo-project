// SSR 完整示例 - 用户仪表板
import type { GetServerSideProps } from 'next'

interface User {
  id: string
  name: string
  email: string
}

interface DashboardData {
  stats: {
    views: number
    likes: number
    comments: number
  }
}

interface DashboardProps {
  user: User
  data: DashboardData
  timestamp: string
}

// 每次请求时执行，获取最新数据
export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
  const { req, res } = context

  // 从 cookie 获取用户信息
  const token = req.cookies.token

  if (!token) {
    // 未登录，重定向到登录页
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  // 验证 token 并获取用户信息
  const user = await verifyToken(token)

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  // 获取用户的实时数据
  const data = await fetchDashboardData(user.id)

  // 设置缓存头（可选）
  res.setHeader('Cache-Control', 'private, s-maxage=10, stale-while-revalidate=59')

  return {
    props: {
      user,
      data,
      timestamp: new Date().toISOString(),
    },
  }
}

export default function Dashboard({ user, data, timestamp }: DashboardProps) {
  return (
    <div>
      <h1>欢迎，{user.name}</h1>
      <p>邮箱：{user.email}</p>

      <div>
        <h2>统计数据</h2>
        <p>浏览量：{data.stats.views}</p>
        <p>点赞数：{data.stats.likes}</p>
        <p>评论数：{data.stats.comments}</p>
      </div>

      <p>页面生成时间：{timestamp}</p>
    </div>
  )
}

// 辅助函数
async function verifyToken(token: string): Promise<User | null> {
  // 验证 JWT token
  try {
    const res = await fetch('https://api.example.com/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  } catch {
    return null
  }
}

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const res = await fetch(`https://api.example.com/dashboard/${userId}`)
  return res.json()
}

// 优势：
// - 数据实时，每次请求都是最新的
// - 可以访问请求上下文（cookies, headers）
// - 适合个性化内容
//
// 适用场景：
// - 用户仪表板
// - 需要认证的页面
// - 个性化推荐
