# AI 核心概念整理

> AI 翻译集成 · Prompt 工程 · Agent 系统 · 面试备考

---

## 一、向量数据库 (Vector Database)

**Q: 什么是向量数据库？和传统数据库有什么区别？**

- 传统数据库：存精确值，查询是"找等于 X 的"
- 向量数据库：存语义向量，查询是"找和 X 最相似的"

```
文本 → Embedding 模型 → [0.23, -0.81, 0.44, ...] (高维向量)
                                    ↓
                        存入向量数据库 (Pinecone / Qdrant / pgvector)
```

**核心能力：语义搜索**

```
用户问："如何重置密码？"
→ 转成向量 → 在文档库中找最相似的几段内容
→ 把这几段塞进 Prompt → LLM 给出准确回答
```

**实际应用场景**：

- RAG（检索增强生成）：让 LLM 回答私有知识库的问题
- i18n 场景：对已有翻译做语义去重，相似 key 直接复用，避免重复调用 API
- 代码搜索：用自然语言描述找相关代码片段

---

## 二、Function Calling 与工具调用 (Tool Calling)

### 2.1 两者的关系与区别

**Q: Function Calling 和 Tool Calling 是同一个东西吗？**

不完全是。Function Calling 是 Tool Calling 的前身，两者有演进关系：

| | Function Calling | Tool Calling |
|---|---|---|
| 出现时间 | OpenAI 2023年6月 | OpenAI 2024年后 / 各家跟进 |
| 能力范围 | 只能调用开发者定义的函数 | 函数 + 内置工具（代码解释器、文件搜索等）|
| API 字段 | `functions` + `function_call` | `tools` + `tool_choice` |
| 支持并行 | 不支持 | 支持同时调用多个工具 |
| 现状 | 已废弃（OpenAI 标记为 deprecated） | 当前标准，各家统一叫法 |

**一句话总结**：Function Calling 是 Tool Calling 的子集，Tool Calling 是进化后的标准叫法。现在说"工具调用"默认指 Tool Calling。

---

### 2.2 Function Calling 原始形态（了解即可）

```typescript
// 旧写法（已废弃）
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: '北京天气怎么样？' }],
  functions: [                          // ← 旧字段
    {
      name: 'get_weather',
      description: '获取指定城市天气',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
  ],
  function_call: 'auto',               // ← 旧字段
})

// 返回结构
// message.function_call.name = 'get_weather'
// message.function_call.arguments = '{"city":"北京"}'
```

---

### 2.3 Tool Calling 现代写法

```typescript
// 新写法（当前标准）
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '北京天气怎么样？' }],
  tools: [                              // ← 新字段，支持多个工具
    {
      type: 'function',                 // 类型：function（未来可能有其他类型）
      function: {
        name: 'get_weather',
        description: '获取指定城市天气',
        parameters: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
      },
    },
  ],
  tool_choice: 'auto',                 // ← 新字段
})

// 返回结构
// message.tool_calls[0].function.name = 'get_weather'
// message.tool_calls[0].function.arguments = '{"city":"北京"}'
```

---

### 2.4 完整调用流程

```
第1轮
用户："北京和上海今天天气怎么样？"
→ LLM 输出两个 tool_call（并行）：
    tool_call_id: "call_1" → get_weather({ city: "北京" })
    tool_call_id: "call_2" → get_weather({ city: "上海" })

你的代码执行这两个函数，拿到结果

第2轮（把工具结果喂回去）
messages: [
  { role: 'user', content: '北京和上海今天天气...' },
  { role: 'assistant', tool_calls: [...] },     // LLM 上一轮的输出
  { role: 'tool', tool_call_id: 'call_1', content: '晴，25°C' },
  { role: 'tool', tool_call_id: 'call_2', content: '阴，18°C' },
]

→ LLM 最终回答："北京今天晴天25°C，上海阴天18°C"
```

**核心原则**：LLM 决定"调什么/调几个"，宿主代码负责"真正执行"，结果再喂回 LLM。

---

### 2.5 在翻译项目中的应用

```typescript
// 工具定义示例
tools: [
  { name: "translate_text", description: "翻译文本到目标语言" },
  { name: "save_to_db", description: "将翻译结果写入数据库" },
  { name: "check_cache", description: "检查翻译缓存" },
]
```

---

## 三、AI Agent

**Q: AI Agent 是什么？和普通 LLM 调用有什么本质区别？**

- 普通 LLM 调用：一问一答，无状态
- AI Agent：LLM + 工具 + **循环推理**，能自主完成多步任务

**Agent 的推理循环（ReAct 模式）**：

```
目标 → Plan（规划）→ Act（执行工具）→ Observe（观察结果）→ 重复，直到目标达成
```

**实例：自动翻译 Agent**

```
目标："把项目里所有缺失的中文翻译补全"

Step 1 → 调工具：查询数据库，获取所有未翻译的 key
Step 2 → 调工具：按批次调用翻译 API（规避限流）
Step 3 → 调工具：校验占位符是否完整
Step 4 → 调工具：写入数据库
Step 5 → 判断：还有未处理的 key？→ 继续；否则完成
```

**Agent 的核心价值**：把原本需要人工干预的多步骤操作，变成一次指令即可完成的自动化任务。

---

## 四、多 Agent 协作

**Q: 为什么需要多 Agent？单 Agent 有什么局限？**

单 Agent 处理复杂任务时容易"迷失"：上下文过长、职责混乱、错误无法隔离。

**多 Agent = 不同角色分工协作**：

```
协调者 Agent (Orchestrator)
    ├── 翻译 Agent：只负责调用 LLM 翻译
    ├── 校验 Agent：检查翻译质量、变量占位符是否完整
    ├── 写库 Agent：只负责数据库写入操作
    └── 报告 Agent：汇总结果，通知用户
```

**对比表**：

| | 单 Agent | 多 Agent 协作 |
|---|---|---|
| 职责 | 全部 | 单一 |
| 上下文 | 越来越长 | 各自独立，干净 |
| 容错 | 一处出错全挂 | 可以隔离重试 |
| 适合场景 | 简单任务 | 复杂、长流程任务 |

---

## 五、提示词工程 (Prompt Engineering)

**Q: 什么是提示词工程？为什么重要？**

同一个模型，Prompt 写法不同，结果质量天差地别。Prompt Engineering 就是系统性地优化输入，使 LLM 输出更准确、更稳定。

**核心技巧**：

**1. 角色设定 (Role Prompting)**
```
你是专业的软件 UI 国际化翻译专家（而不是文学翻译家）
```

**2. 结构化指令**（条目化比连续文字更可靠）
```
约束：
1. 保留变量占位符，如 {name}、{{count}}
2. 符合 UI 文案风格（简洁，非翻译腔）
3. 不添加任何解释说明
```

**3. 利用 Key 名作为上下文**
```
i18n Key: user.profile.reset_password_button
→ LLM 能推断这是"按钮文案"，翻译风格更简洁
```

**4. Few-shot 示例**
```
示例输入："提交"
示例输出：{"en": "Submit", "ja": "送信", "ko": "제출"}
（而不是 "Please click to submit the form"）
```

**Bad Prompt vs Good Prompt 对比**：

```
❌ Bad: 你是翻译专家将以下文本翻译为目标语言保留占位符返回JSON

✅ Good:
# 角色
你是专业的软件 UI 国际化翻译专家。

# 上下文
- Key: `user.profile.reset_password_button`（按钮文案）
- 源语言: 简体中文 | 源文本: "重置密码"

# 约束
1. 保留变量占位符 {name}、{{count}}
2. UI 文案风格，简洁
3. 仅返回 JSON

# 输出
{"en": "...", "ja": "..."}
```

---

## 六、流程编排 (Workflow Orchestration)

**Q: 什么是流程编排？和多 Agent 有什么区别？**

| | 多 Agent 协作 | 流程编排 |
|---|---|---|
| 决策者 | Agent 自主判断 | 预先定义的流程图 |
| 灵活性 | 高，能应对意外 | 低，按固定路径执行 |
| 可预测性 | 低 | 高 |
| 适合场景 | 复��开放问题 | 明确重复的业务流程 |

**翻译系统的编排示例**：

```
触发翻译请求
    ↓
[节点1] 检查缓存 → 命中 → 直接返回，结束
    ↓ 未命中
[节点2] 过滤：找出哪些语言缺少翻译
    ↓
[节点3] 并行分支
    ├── 亚洲语言 (zh/ja/ko) → 调用 Qwen API
    └── 欧洲语言 (en/fr/de) → 调用 GPT-4o-mini
    ↓ 等待两个分支都完成
[节点4] 校验占位符完整性
    ↓ 校验失败 → 重试节点3（最多3次）
    ↓ 校验通过
[节点5] 写入数据库
    ↓
[节点6] 通知用户完成
```

**常见编排工具**：

| 工具 | 定位 |
|------|------|
| LangGraph | 专为 AI Agent 设计的图编排 |
| Temporal | 通用工作流，擅长长时任务、重试、幂等 |
| n8n / Dify | 可视化低代码，拖拽连接节点 |
| Inngest | 事件驱动后台工作流，适��� Node.js |

---

## 七、概念关系总结

```
Prompt 工程   →  控制单次 LLM 调用的质量
工具调用      →  让 LLM 能触发外部动作
AI Agent     →  LLM 自主决定调哪些工具、调几次
多 Agent     →  多个 Agent 分工协作
流程编排      →  把以上节点串起来，加上条件/并行/重试/监控
向量数据库    →  为 Agent 提供语义检索能力（记忆 + 知识库）
```

**技术栈演进路径**（结合 i18n 翻译项目）：

```
基础翻译（现阶段）
    ↓
Prompt 工程优化（翻译质量提升）
    ↓
工具调用（翻译 + 写库 + 通知）
    ↓
AI Agent（自动处理整批 key）
    ↓
多 Agent（翻译/校验/写库分工）
    ↓
流程编排（并行分支 + 重试 + 监控）
    ↓
向量数据库（语义去重，避免重复翻译，降低成本）
```

---

## 八、Token 成本优化策略

**核心原则：成本 = Token 数量 × 单价**

| 优化方向 | 具体做法 | 预期收益 |
|---|---|---|
| 只翻译缺失语言 | 调用前过滤已有翻译 | 减少 30-70% 输出 token |
| 缓存相同翻译 | key + 源文本 → 缓存结果 | 消除重复调用 |
| 按文本长度选模型 | 短文本用 turbo，长文本用 plus | 降低 30-50% 成本 |
| 按语言族分模型 | 亚洲语言用 Qwen，欧洲语言用 GPT | 质量和成本双优化 |
| 批量翻译 | 一次调用翻译所有目标语言 | 减少 API 调用次数 |
