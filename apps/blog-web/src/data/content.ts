import { CDN_URL } from './contant';

export const navLinks = [
  { label: '关于我', href: '/about' },
  { label: '项目', href: '/projects' },
  { label: '简历', href: '/resume' },
  { label: '文章', href: '/blog' },
];

export const projects = [
  {
    preview: `${CDN_URL}/images/boya.png`,
    title: 'i18n 国际化平台',
    desc: '一站式多语言管理平台，集中管理多语言文案，告别 Excel 混乱时代，在线翻译 & AI 赋能，告别手动 Google 翻译，提升本地化效率 10 倍',
    tips: '登录即注册 ,可以体验完整功能',
    tags: ['React', 'Fastify', 'PostgreSQL', 'NestJS', 'Ant Design', 'TailwindCSS'],
    github: 'https://github.com/Wild-bit/boya-stack',
    website: 'https://app.boya.fit',
  },
  {
    preview: `${CDN_URL}/images/nav-preview.png`,
    title: '导航工具网站',
    desc: '导航工具网站，收集各种实用工具以及自定义工具，方便快捷地找到需要的工具。',
    tags: [
      'React',
      'TailwindCSS',
      'TypeScript',
      'Next',
      'Vercel',
      'Vercel',
      'Supabase',
      'shadcn/ui',
    ],
    website: 'https://navtools.rfcont.uk',
    tips: '体验账号：visitor  密码：123456!',
    github: '',
  },
  {
    title: '个人博客网站',
    preview: `${CDN_URL}/images/blog.png`,
    desc: '个人博客，记录个人学习历程，分享技术文章，记录生活点滴，记录工作心得。',
    tags: ['React', 'TailwindCSS', 'TypeScript', 'Tencent Cloud Pages', 'Markdown'],
    github: 'https://github.com/Wild-bit/my-monorepo-project/tree/main/apps/blog-web',
    website: 'https://blog.lancespace.club',
  },
  {
    title: '基于Axios 封装的 请求工具 http-client',
    preview: `${CDN_URL}/images/http-client.png`,
    desc: '类型安全，将相关的 API 定义组织到模块中，使代码结构更清晰、更易于维护。',
    tags: ['TypeScript', 'Axios'],
    github: 'https://github.com/Wild-bit/http-client',
  },
];

export const experiences = [
  {
    period: '2024.03 — 2025.12',
    title: '高级前端工程师',
    company: '深圳起量加信息技术科技有限公司',
    desc: [
      '负责 Deepclick（广告转化优化平台）与 Roibest（PWA 安装服务平台）的前端开发',
      '主导前端基础设施建设与工程化能力沉淀，通过平台化与工具化手段提升多项目开发效率与可维护性',
    ],
    highlights: [
      {
        title: 'i18n 国际化管理平台',
        tag: '架构设计',
        items: [
          '从 0 到 1 设计并实现一站式多语言（i18n）管理平台，解决多项目、多语言文案分散管理问题，提升文案管理规范性与协作效率',
          '技术栈：React + NestJS + PostgreSQL + Fastify，采用前后端分离架构',
          '基于 GitHub Actions 实现自动化部署流程，并结合 PM2 进行服务进程管理，保障系统稳定运行',
          '集中文案管理，支持多项目接入及 JSON 导入导出，提升文案维护一致性与协作效率',
          '接入 Qwen-plus 模型实现 AI 翻译能力，提升多语言本地化效率约 10 倍',
        ],
      },
      {
        title: '导航工具平台',
        tag: '全栈开发',
        items: [
          '搭建内部导航工具网站，集成常用开发工具、公司产品链接（区分正式服，测试服，网站资源等）',
          '技术栈：Next.js + Supabase + shadcn/ui + TailwindCSS',
          '实现自定义URL解析功能，解析URL中的参数工具',
        ],
      },
      {
        title: 'PWA SDK 与基础设施',
        tag: '重点亮点',
        items: [
          '为 Deepclick 平台设计并开发 PWA SDK，统一封装 Service Worker 生命周期与 Manifest 配置，降低业务接入成本',
          '基于 Verdaccio 搭建私有 npm 仓库，沉淀通用工具库与 PWA 能力模块，实现跨项目复用与版本管理',
          '封装静态资源缓存能力（基于 Workbox 实现），针对图片等资源采用 Stale-While-Revalidate 策略，并结合过期与容量控制优化缓存生命周期，支持弱网或离线场景下已缓存资源访问',
          '提供推送通知与应用安装引导能力，提升 Web 应用可达性与用户体验',
        ],
      },
    ],
  },
  {
    period: '2021.04 — 2024.01',
    title: '前端开发工程师',
    company: '广州点云科技有限公司',
    desc: [
      '负责云游戏平台 Web 端及 App 内嵌 H5 活动页以及常驻页的业务开发',
      '主导前端性能优化、Hybrid（JSBridge）通信能力建设及工程化工具链优化',
    ],
    highlights: [
      {
        title: '性能优化体系建设',
        tag: '重点强化',
        items: [
          '主导 H5 页面性能优化，建立基于数据指标的优化方案（FCP / LCP / 资源体积）',
          '通过 webpack-bundle-analyzer 分析依赖体积，推动第三方库拆分与按需加载',
          '使用 externals + CDN 引入（vue / vue-router / SDK），显著降低主包体积',
          '优化资源加载策略（图片 WebP 转换、资源压缩等）',
        ],
        metrics: [
          { label: '包体积', before: '81.78KB', after: '53.06KB', improvement: '↓35%' },
          { label: 'FCP', before: '2.86s', after: '1.59s', improvement: '↓44%' },
          { label: 'LCP', before: '3.15s', after: '1.79s', improvement: '↓43%' },
        ],
      },
      {
        title: 'Hybrid 架构（WebView + JSBridge）',
        tag: '重点亮点',
        items: [
          '主导 App 内嵌 H5（WebView）业务开发，设计并实现 JSBridge 通信机制，实现 H5 与原生能力交互',
          '封装统一 Bridge 调用层，规范 H5 与客户端通信方式，降低业务侧接入复杂度',
          '支持登录态获取、埋点上报、原生组件调用及 UI 控制（如标题栏控制）等核心能力',
        ],
      },
      {
        title: 'Vue 项目脚手架：shedcli',
        tag: '重点亮点',
        items: [
          '支持 Vue2 和 Vue3 双版本',
          '插件化功能选择：API 域名、路由、状态管理、国际化',
          '交互式命令行体验',
          '基于 AST 的智能代码生成',
        ],
      },
    ],
  },
];

export const skills = [
  {
    name: 'JavaScript',
    icon: 'static/images/js.svg',
  },
  {
    name: 'TypeScript',
    icon: 'static/images/ts.svg',
  },
  {
    name: 'React',
    icon: 'static/images/react.svg',
  },
  {
    name: 'Vue',
    icon: 'static/images/vue.svg',
  },
  {
    name: 'Next.js',
    icon: 'static/images/next.svg',
  },
  {
    name: 'Nest.js',
    icon: 'static/images/nest.svg',
  },
  {
    name: 'Node.js',
    icon: 'static/images/node.svg',
  },
  {
    name: 'PostgreSQL',
    icon: 'static/images/pg.svg',
  },
  {
    name: 'Docker',
    icon: 'static/images/docker.svg',
  },
  {
    name: 'TailwindCSS',
    icon: 'static/images/tailwindcss.svg',
  },
  {
    name: 'Git',
    icon: 'static/images/git.svg',
  },
  {
    name: 'Zustand',
    icon: 'static/images/zustand.svg',
  },
  {
    name: 'pinia',
    icon: 'static/images/pinia.svg',
  },
];

export const contactLinks = [
  { emoji: '✉️', text: 'lzh32534@gmail.com', type: 'email' },
  {
    icon: 'static/images/github.svg',
    text: 'GitHub',
    type: 'github',
    link: 'https://github.com/Wild-bit',
  },
  { emoji: '💬', text: '微信', type: 'wechat' },
  { emoji: '📍', text: '中国 · 广州', type: 'location' },
];
