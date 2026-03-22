# Claude Code 中 MCP 与 Skills 的区别：选对工具，事半功倍

## 前言

用过 Claude Code 的开发者，多少都接触过 MCP 和 Skills 这两个概念。它们都能扩展 Claude 的能力，但定位完全不同。搞混了不仅用不好，还会浪费 token。

这篇文章帮你理清两者的区别，搞明白什么时候该用哪个。

## MCP 是什么

MCP（Model Context Protocol）是 Anthropic 推出的开放协议，用来标准化 AI 与外部工具/数据源的连接方式。你可以把它理解为 AI 的"USB-C 接口"——一个统一的协议，让 Claude Code 能和数据库、API、浏览器、文件系统等外部系统通信。

### 工作原理

```
Claude Code (MCP Client)
    ↕ JSON-RPC (stdio / SSE)
MCP Server (GitHub / Playwright / DB / ...)
    ↕
External System (GitHub API / Browser / Database / ...)
```

- Claude Code 作为 MCP 客户端
- 每个 MCP Server 封装了对某个外部系统的访问能力
- 通信方式：stdio（本地子进程）或 SSE（远程服务器）
- 每个 MCP Server 可以暴露：工具（tools）、资源（resources）、提示模板（prompts）

### 配置方式

通过 CLI 命令添加：

```bash
# 项目级（存储在 .claude/settings.json，团队共享）
claude mcp add --scope project context7 -- npx -y @upstash/context7-mcp@latest

# 用户级（存储在 ~/.claude.json，个人使用）
claude mcp add --scope local github -- npx -y @modelcontextprotocol/server-github
```

或者直接编辑配置文件：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "type": "stdio"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp"],
      "type": "stdio"
    }
  }
}
```

管理命令：

```bash
claude mcp list                   # 查看已配置的 Server
claude mcp remove <server-name>   # 移除 Server
claude mcp get <server-name>      # 查看 Server 配置
```

## Skills 是什么

Skills 是 Markdown 格式的指令文件，存储在 `.claude/skills/` 目录下。它定义了 Claude 应该遵循的工作流程，创建后自动注册为斜杠命令。

### 文件结构

```
.claude/
└── skills/
    └── review/
        └── SKILL.md
```

### SKILL.md 示例

```markdown
---
name: review
description: Perform code review following team standards
---

## Instructions

按照以下维度审查代码变更：
1. 正确性
2. 安全性
3. 性能
4. 可维护性

使用 $ARGUMENTS 指定要审查的文件范围。
```

创建后直接用 `/review` 触发。

## 核心区别

这是最关键的部分。一句话总结：

> MCP 给 Claude 提供**能力**（能做什么），Skills 给 Claude 提供**指令**（怎么做）。

详细对比：

| 维度 | MCP | Skills |
|------|-----|--------|
| 本质 | 连接外部工具的协议 | Markdown 工作流指令 |
| 提供的是 | 工具、数据访问、API 连接 | 流程、规范、领域知识 |
| 存储位置 | `.claude/settings.json` 或 `~/.claude.json` | `.claude/skills/` 目录 |
| 编写语言 | 任意语言（TypeScript、Python 等） | 纯 Markdown |
| 触发方式 | 配置后始终可用，Claude 按需调用 | 斜杠命令触发或按描述自动加载 |
| Token 开销 | 每个 Server 每轮都有协议开销（约 17%） | 按需加载，仅激活时消耗（约 12%） |
| 典型用途 | 让 Claude 能操作 GitHub、浏览器、数据库 | 让 Claude 按团队规范做代码审查 |

### 一个类比

如果把 Claude Code 比作一个开发者：

- MCP 是他的**工具箱**——锤子、螺丝刀、万用表，决定了他能做什么
- Skills 是他的**操作手册**——SOP、检查清单、最佳实践，决定了他怎么做

工具箱里有锤子（MCP），不代表他知道怎么钉钉子（Skills）。反过来，有了操作手册（Skills），没有锤子（MCP）也干不了活。

## 推荐的 MCP Server

以下是我实际在用的、值得推荐的 MCP Server：

### Context7 — 实时文档查询

```bash
claude mcp add --scope project context7 -- npx -y @upstash/context7-mcp@latest
```

解决 Claude 对库 API 的"幻觉"问题。它能实时拉取指定版本的库文档，而不是依赖训练数据中可能过时的信息。当你用的库更新了 API，这个 Server 特别有用。

### Playwright — 浏览器自动化

```bash
claude mcp add --scope project playwright -- npx -y @executeautomation/playwright-mcp
```

让 Claude 能操控浏览器：打开页面、截图、点击元素、运行 E2E 测试。调试前端问题时，Claude 可以直接"看到"页面效果。

### GitHub — 仓库操作

```bash
claude mcp add --scope project github -- npx -y @modelcontextprotocol/server-github
```

让 Claude 能读 Issue、审查 PR、搜索代码、创建分支。配合 Skills 使用，可以实现自动化的 PR 审查工作流。

### Filesystem — 文件系统访问

```bash
claude mcp add --scope project filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/dir
```

在指定目录范围内读写文件。适合需要跨项目操作文件的场景。

### Sentry — 错误追踪

让 Claude 直接拉取 Sentry 的错误报告和堆栈信息，排查线上问题时不用再手动复制粘贴。

### Figma — 设计稿读取

读取 Figma 设计稿，让 Claude 生成匹配设计的代码。设计还原场景下很实用。

## 最佳实践：MCP + Skills 组合使用

单独用 MCP 或 Skills 都能提升效率，但组合使用才是最强形态。

### 示例：自动化部署检查

创建一个 `/deploy-check` Skill：

```markdown
---
name: deploy-check
description: Pre-deployment checklist and verification
---

## Instructions

执行部署前检查：

1. 使用 GitHub MCP 检查目标分支是否有未合并的 PR
2. 运行项目测试，确保全部通过
3. 使用 Playwright MCP 对关键页面进行截图对比
4. 生成部署检查报告

如果任何步骤失败，停止并报告问题。
```

这个 Skill 编排了整个部署检查流程（指令层），同时调用了 GitHub 和 Playwright 两个 MCP Server 的能力（工具层）。

### 示例：智能代码审查

```markdown
---
name: smart-review
description: Code review with live documentation verification
---

## Instructions

1. 分析当前 git diff 中的代码变更
2. 对于使用了第三方库的代码，通过 Context7 MCP 验证 API 用法是否正确
3. 检查是否有安全隐患、性能问题
4. 输出结构化的审查报告
```

## 性能提示

每个 MCP Server 都会增加每轮对话的 token 开销（协议元数据）。建议：

- 只配置当前项目需要的 Server，不要贪多
- 5 个 Server 是一个实际的上限，超过后上下文压力明显
- 项目级配置优于全局配置，避免不相关的 Server 占用 token
- Skills 按需加载，token 开销更可控

## 总结

| 场景 | 用什么 |
|------|--------|
| 需要连接外部 API / 服务 | MCP |
| 需要实时数据（搜索、文档、错误日志） | MCP |
| 需要在外部系统执行操作（创建 PR、跑测试） | MCP |
| 需要 Claude 遵循特定工作流程 | Skills |
| 需要统一团队的编码规范和流程 | Skills |
| 需要自动化复杂的多步骤任务 | MCP + Skills |

记住那个类比：MCP 是工具箱，Skills 是操作手册。根据你的需求选对工具，才能真正发挥 Claude Code 的潜力。
