# Claude Code Skills 实用指南：提升你的 AI 编程效率

## 前言

Claude Code 是 Anthropic 推出的 CLI 编程助手，它不仅能帮你写代码、修 bug，还提供了一套强大的 **Skills** 扩展机制。通过 Skills，你可以将常用的工作流封装成可复用的指令，用一个斜杠命令就能触发复杂的操作流程。

本文将介绍 Claude Code 中实用的内置 Skills 和社区 Skills，并手把手教你创建自定义 Skill。

## Skills vs Slash Commands

在 Claude Code 中，这两个概念经常被混淆，先厘清一下：

| 特性 | Slash Commands | Skills |
|------|---------------|--------|
| 定义方式 | 内置于 CLI | Markdown 文件（SKILL.md） |
| 可扩展性 | 不可自定义 | 完全可自定义 |
| 触发方式 | `/command` | `/skill-name` |
| 存储位置 | CLI 内部 | `.claude/skills/` 目录 |

简单来说：**Slash Commands 是固定的内置操作，Skills 是可扩展的工作流模板**。创建一个 Skill 后，它会自动注册为一个斜杠命令。

## 内置实用命令推荐

Claude Code 自带了一些非常实用的命令和 Skills，以下是我日常高频使用的：

### /init — 项目初始化

```bash
/init
```

在项目根目录生成 `CLAUDE.md` 文件，这是 Claude Code 的项目配置文件。它会自动分析你的项目结构、技术栈、构建命令等，生成一份上下文说明。之后每次对话，Claude 都会读取这个文件来理解你的项目。

建议每个项目都执行一次，相当于给 Claude 一份项目说明书。

### /plan — 计划模式

```bash
/plan 实现用户登录功能
```

进入计划模式后，Claude 会先分析代码库、设计方案，而不是直接动手写代码。适合：

- 需要改动多个文件的功能开发
- 不确定实现方案的复杂任务
- 想先对齐思路再动手的场景

计划确认后再执行，避免返工。

### /commit — 智能提交

```bash
/commit
```

自动分析你的 `git diff`，生成符合 Conventional Commits 规范的 commit message。省去了每次想 commit 信息的时间，而且生成的信息通常比手写的更准确、更规范。

### /review — 代码审查

```bash
/review
```

对当前的代码变更进行审查，会检查：

- 潜在的 bug 和逻辑错误
- 性能问题
- 安全隐患
- 代码规范违反

相当于一个随时在线的 Code Reviewer，特别适合个人开发者或小团队。

### /compact — 上下文压缩

```bash
/compact
```

当对话变长、上下文接近限制时，用这个命令压缩历史消息。Claude 会保留关键信息，释放上下文空间。长时间编码会话中非常有用。

### /simplify — 代码简化

这是一个内置 Skill，会审查你改动过的代码，检查：

- 是否有可复用的现有函数
- 代码质量和效率问题
- 不必要的复杂度

然后自动修复发现的问题。重构代码时很好用。

## 社区热门 Skills 推荐

除了内置的，社区也贡献了大量实用的 Skills。以下按类别推荐：

### 代码重构类

**refactor Skill** — 引导式重构工作流，会先分析代码结构，提出重构方案，确认后再执行。比直接说"重构这段代码"更有条理。

创建方式：在 `.claude/skills/refactor/SKILL.md` 中定义重构的步骤和检查清单。

### 测试生成类

**test-gen Skill** — 分析目标函数的输入输出，自动生成单元测试。支持 Jest、Vitest、Mocha 等主流框架。

```markdown
---
name: test-gen
description: Generate unit tests for the specified function or module
---

## Instructions

1. Read the target file and understand the function signatures
2. Identify edge cases and boundary conditions
3. Generate tests using the project's existing test framework
4. Follow the project's existing test patterns and conventions
```

### 文档生成类

**doc-gen Skill** — 为函数、模块或 API 自动生成文档。可以配置输出格式（JSDoc、README、API 文档等）。

### 安全审计类

**security-audit Skill** — 扫描代码中的安全隐患，包括：

- SQL 注入
- XSS 漏洞
- 敏感信息泄露
- 依赖漏洞

适合在提交前做一次快速安全检查。

### UI/UX 设计类：ui-ux-pro-max

这是我个人强烈推荐的一个 Skill，专注于 UI/UX 设计与前端实现。它内置了丰富的设计知识库：

- **67 种设计风格**：glassmorphism、claymorphism、minimalism、brutalism、neumorphism、bento grid 等
- **96 套配色方案**：覆盖各种场景的专业调色板
- **57 组字体搭配**：经过验证的字体组合推荐
- **25 种图表类型**：数据可视化方案
- **13 种技术栈支持**：React、Next.js、Vue、Svelte、SwiftUI、React Native、Flutter、Tailwind、shadcn/ui 等

#### 适用场景

当你需要 Claude 帮你做前端开发时，这个 Skill 能显著提升产出的设计质量：

```bash
# 设计一个 landing page
/ui-ux-pro-max design a landing page for a SaaS product

# 审查现有 UI 的设计问题
/ui-ux-pro-max review the navbar component

# 用 glassmorphism 风格重构卡片组件
/ui-ux-pro-max refactor Card component with glassmorphism style
```

#### 支持的操作

| 操作 | 说明 |
|------|------|
| `plan` / `design` | 设计方案规划 |
| `build` / `create` / `implement` | 从零构建组件或页面 |
| `review` / `check` | 审查现有 UI/UX 代码 |
| `fix` / `improve` / `optimize` / `enhance` | 优化现有实现 |
| `refactor` | 重构 UI 代码 |

#### 为什么推荐

普通对话中让 Claude 写前端代码，产出的 UI 往往比较"AI 味"——千篇一律的布局、缺乏设计感。而 `ui-ux-pro-max` 通过预置的设计知识，让 Claude 能产出更有辨识度、更专业的前端代码。特别是在做 landing page、dashboard、portfolio 这类对设计要求较高的页面时，效果差异非常明显。

## 如何创建自定义 Skill

创建 Skill 非常简单，只需要一个 Markdown 文件。

### 目录结构

```
.claude/
└── skills/
    └── my-skill/
        └── SKILL.md
```

- **项目级 Skill**：放在项目的 `.claude/skills/` 下，仅当前项目可用
- **全局 Skill**：放在 `~/.claude/skills/` 下，所有项目可用

### SKILL.md 格式

```markdown
---
name: my-skill
description: 一句话描述这个 Skill 做什么
---

## Instructions

这里写 Claude 需要遵循的指令...

可以使用 $ARGUMENTS 来接收用户传入的参数。
```

关键字段：

- `name`：Skill 名称，也是斜杠命令名（`/my-skill`）
- `description`：描述信息，Claude 会根据这个判断是否自动加载
- `$ARGUMENTS`：占位符，会被用户输入的参数替换

### 触发方式

```bash
/my-skill 这里是参数
```

`$ARGUMENTS` 会被替换为 "这里是参数"。

## 实战：创建一个 Code Review Skill

下面创建一个实用的代码审查 Skill，比内置的 `/review` 更定制化。

### 1. 创建文件

```bash
mkdir -p .claude/skills/cr
```

### 2. 编写 SKILL.md

```markdown
---
name: cr
description: Perform a thorough code review on the current changes
---

## Instructions

对当前的代码变更执行一次全面的 Code Review。

### 审查维度

1. **正确性** — 逻辑是否正确，边界条件是否处理
2. **安全性** — 是否存在 XSS、注入、敏感信息泄露等问题
3. **性能** — 是否有不必要的重渲染、内存泄漏、N+1 查询等
4. **可维护性** — 命名是否清晰，是否有重复代码，是否符合项目规范
5. **测试覆盖** — 关键逻辑是否有测试覆盖

### 输出格式

按严重程度分类输出：
- 🔴 必须修复
- 🟡 建议优化
- 🟢 小建议

每条反馈包含：文件路径、行号、问题描述、修复建议。

### 上下文

- 使用 git diff 获取当前变更
- 阅读相关文件理解上下文
- 参考项目的 CLAUDE.md 了解项目规范
```

### 3. 使用

```bash
/cr
```

Claude 会按照你定义的审查维度和输出格式，对当前变更进行结构化的代码审查。

## 进阶技巧

### 组合使用

Skills 可以串联使用，形成完整的开发工作流：

```bash
# 1. 先规划
/plan 添加用户注册功能

# 2. 实现后审查
/cr

# 3. 简化代码
/simplify

# 4. 提交
/commit
```

### 团队共享

将 `.claude/skills/` 目录提交到 Git 仓库，团队成员 clone 后即可使用相同的 Skills。这样可以统一团队的开发工作流和代码规范。

### 配合 CLAUDE.md

在 `CLAUDE.md` 中定义项目规范，Skills 执行时会自动读取这些规范。比如你在 CLAUDE.md 中写了"commit message 使用中文"，`/commit` 就会生成中文的提交信息。

## 总结

Claude Code Skills 的核心价值在于**将重复的工作流程标准化**。与其每次都用自然语言描述你想要什么，不如把它封装成一个 Skill，一个命令搞定。

推荐的入门路径：

1. 先熟练使用内置命令（`/init`、`/plan`、`/commit`、`/review`）
2. 根据自己的工作流创建 1-2 个自定义 Skill
3. 在团队中推广，统一开发规范

好的工具不是用来炫技的，而是让你专注于真正重要的事情 — 写出好代码。
