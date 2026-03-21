# 从零搭建企业级 Monorepo 工程体系

## 前言

随着前端项目的复杂度不断提升，传统的多仓库（multi-repo）模式已经难以满足团队协作的需求。Monorepo（单体仓库）作为一种新的代码管理模式，正在被越来越多的团队采用。

## 什么是 Monorepo？

Monorepo 是一种将多个项目（packages）放在同一个代码仓库中进行管理的开发方式。与传统的多仓库模式相比，Monorepo 具有以下优势：

- **代码共享便捷**：多个项目之间可以轻松共享代码
- **统一版本控制**：所有依赖的版本可以保持一致
- **原子提交**：一个功能可以同时修改多个项目
- **简化 CI/CD**：统一的构建和测试流程

## 技术选型

我们将使用以下工具来搭建 Monorepo 工程体系：

### pnpm

pnpm 是一个快速、节省空间的包管理器，它使用硬链接和符号链接来管理 node_modules，大幅减少了磁盘空间的占用。

### Turborepo

Turborepo 是一个高性能的构建系统，专为 Monorepo 设计。它提供了：

- 增量构建
- 任务调度
- 远程缓存
- 可视化任务图

## 项目结构

```
my-monorepo/
├── apps/
│   ├── web/          # 前端应用
│   ├── admin/        # 管理后台
│   └── api/          # 后端服务
├── packages/
│   ├── ui/           # UI 组件库
│   ├── utils/        # 工具函数
│   └── config/       # 共享配置
├── pnpm-workspace.yaml
└── turbo.json
```

## 开始搭建

### 1. 初始化项目

首先，创建项目目录并初始化 pnpm workspace：

```bash
mkdir my-monorepo && cd my-monorepo
pnpm init
```

### 2. 配置 pnpm workspace

创建 `pnpm-workspace.yaml` 文件：

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 3. 安装 Turborepo

```bash
pnpm add -D turbo -w
```

## 最佳实践

### 1. 合理的包划分

将代码按照功能边界划分成不同的包：

- **共享业务逻辑**：放在 packages/business-*
- **UI 组件**：放在 packages/ui
- **工具函数**：放在 packages/utils

### 2. 依赖管理

遵循以下原则：

- 优先使用内部包（workspace:*）
- 避免循环依赖
- 合理控制包的粒度

### 3. 构建优化

使用 Turborepo 的增量构建能力，只构建受影响的包：

```bash
turbo build --filter=@apps/web
```

## 总结

通过 pnpm + Turborepo 的组合，我们可以搭建一个高效、易维护的 Monorepo 工程体系。这种架构特别适合中大型团队和复杂项目。

> 记住：工具只是手段，团队协作和代码质量才是核心。
