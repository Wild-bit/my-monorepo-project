// Hydration 演示 - 常见问题和解决方案
import { useState, useEffect } from 'react'
import type { GetServerSideProps } from 'next'

interface HydrationDemoProps {
  serverData: string
}

export const getServerSideProps: GetServerSideProps<HydrationDemoProps> = async () => {
  return {
    props: {
      serverData: '这是服务器端的数据',
    },
  }
}

export default function HydrationDemo({ serverData }: HydrationDemoProps) {
  return (
    <div>
      <h1>Hydration 演示</h1>

      {/* 示例 1：正确处理时间 */}
      <GoodTimeComponent />

      {/* 示例 2：错误处理时间（会导致 Hydration mismatch） */}
      {/* <BadTimeComponent /> */}

      {/* 示例 3：正确处理浏览器 API */}
      <GoodBrowserAPIComponent />

      {/* 示例 4：条件渲染 */}
      <ConditionalRenderComponent />

      {/* 示例 5：服务器数据 */}
      <p>服务器数据：{serverData}</p>
    </div>
  )
}

// ✅ 正确：使用 useEffect 处理时间
function GoodTimeComponent() {
  const [currentTime, setCurrentTime] = useState<string | null>(null)

  useEffect(() => {
    // 只在客户端执行
    setCurrentTime(new Date().toISOString())

    // 可选：定时更新
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <h2>当前时间</h2>
      <p>{currentTime || '加载中...'}</p>
    </div>
  )
}

// ❌ 错误：直接在渲染中使用时间（会导致 Hydration mismatch）
function BadTimeComponent() {
  // 服务器：2024-01-01T10:00:00Z
  // 客户端：2024-01-01T10:00:05Z
  // 结果：Hydration mismatch 错误！
  return (
    <div>
      <h2>当前时间</h2>
      <p>{new Date().toISOString()}</p>
    </div>
  )
}

// ✅ 正确：使用 useEffect 处理浏览器 API
function GoodBrowserAPIComponent() {
  const [windowWidth, setWindowWidth] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isMounted) {
    // 服务器端和首次渲染返回占位符
    return <div>窗口宽度：计算中...</div>
  }

  return (
    <div>
      <h2>窗口宽度</h2>
      <p>{windowWidth}px</p>
    </div>
  )
}

// ✅ 正确：条件渲染保持一致
function ConditionalRenderComponent() {
  const [showContent, setShowContent] = useState(false)

  return (
    <div>
      <h2>条件渲染</h2>
      <button onClick={() => setShowContent(!showContent)}>
        {showContent ? '隐藏' : '显示'}内容
      </button>

      {/* 服务器和客户端初始状态一致 */}
      {showContent && (
        <div>
          <p>这是条件渲染的内容</p>
        </div>
      )}
    </div>
  )
}

// Hydration 最佳实践总结：
//
// 1. 避免在渲染中使用非确定性值
//    ❌ new Date(), Math.random()
//    ✅ 使用 useEffect 在客户端更新
//
// 2. 避免在渲染中使用浏览器 API
//    ❌ window, document, localStorage
//    ✅ 使用 useEffect 或检查 typeof window !== 'undefined'
//
// 3. 保持服务器和客户端初始状态一致
//    ❌ 服务器渲染 A，客户端渲染 B
//    ✅ 初始状态相同，然后在 useEffect 中更新
//
// 4. 使用 suppressHydrationWarning（谨慎使用）
//    <div suppressHydrationWarning>
//      {new Date().toISOString()}
//    </div>
//
// 5. 监控 Hydration 性能
//    - 使用 Next.js 的 reportWebVitals
//    - 关注 TTI（可交互时间）指标
