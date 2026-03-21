# Blog Web

个人博客与作品集网站，基于 React + TypeScript + Vite 构建，采用暗色主题与玻璃拟态设计风格。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| UI 组件 | shadcn/ui + Radix UI |
| 路由 | React Router DOM 7 |
| 状态管理 | Zustand 5 |
| 图标 | Lucide React |
| 字体 | Inter / Geist |

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── ui/              # shadcn/ui 基础组件
│   ├── Navbar.tsx       # 顶部导航栏
│   ├── HeroSection.tsx  # 首页 Hero 区域
│   ├── BlogSection.tsx  # 博客文章列表
│   ├── ContactSection.tsx        # 联系方式
│   ├── GitHubContributions.tsx   # GitHub 贡献热力图
│   ├── BackgroundOrbs.tsx        # 动态背景装饰
│   └── Footer.tsx       # 页脚
├── pages/               # 页面
│   ├── Home.tsx         # 首页
│   ├── AboutMe.tsx      # 关于我
│   ├── Projects.tsx     # 项目展示
│   ├── Resume.tsx       # 工作经历与技能
│   └── Blog.tsx         # 博客
├── data/                # 静态数据
│   ├── content.ts       # 项目、经历、技能、博客等内容数据
│   └── contant.ts       # CDN 地址等常量
├── store/               # 状态管理
│   └── contribution.ts  # GitHub 贡献数据 Store
├── lib/                 # 工具函数
│   └── utils.ts         # cn() 样式合并工具
├── App.tsx              # 路由配置
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页，包含 Hero、博客、联系方式 |
| `/about` | AboutMe | 个人简介、技术栈、工具环境 |
| `/projects` | Projects | 项目作品展示 |
| `/resume` | Resume | 工作经历时间线与技能 |
| `/blog` | Blog | 博客文章 |

## 开发

```bash
# 安装依赖（在 monorepo 根目录执行）
pnpm install

# 启动开发服务器
pnpm --filter @app/blog-web dev

# 类型检查
pnpm --filter @app/blog-web typecheck

# 生产构建
pnpm --filter @app/blog-web build

# 预览构建产物
pnpm --filter @app/blog-web preview

# 清理构建缓存
pnpm --filter @app/blog-web clean
```

开发服务器默认运行在 `http://localhost:3001`。

## 设计特点

- **暗色主题** — 深色背景 (`#0f0f1a`) 搭配紫粉渐变色
- **玻璃拟态** — 半透明毛玻璃卡片效果 (backdrop-blur)
- **动态背景** — 浮动渐变光球动画
- **GitHub 贡献图** — 实时拉取 GitHub 贡献数据并渲染热力图
