# 从零打造一个 Vue 项目脚手架：我的实践与思考

## 前言

作为一名前端开发，你是否也遇到过这样的场景：每次新建项目都要重复配置路由、状态管理、API 封装？团队成员的项目结构各不相同，代码规范难以统一？

这就是我开发 `shedcli` 的初衷。这篇文章将分享我如何从零打造一个企业级 Vue 脚手架工具，以及在这个过程中的技术选型和踩坑经验。

## 一、为什么要造轮子？

### 1.1 现有工具的局限

Vue CLI 和 Vite 都是优秀的工具，但在企业场景下，我们面临一些特殊需求：

- **业务定制化**：公司有多个项目线（pcgo、chikii、mita），每个项目的 API 域名、配置都不同
- **技术栈统一**：需要内置 Protobuf 通信、特定的 API 封装方式
- **开发效率**：希望一键生成包含路由、状态管理、国际化的完整项目
- **规范统一**：确保团队成员创建的项目结构一致

### 1.2 目标定位

我希望打造一个：

- 支持 Vue2 和 Vue3 双版本
- 插件化功能选择
- 交互式命令行体验
- 基于 AST 的智能代码生成

## 二、技术选型的思考

### 2.1 核心依赖选择

```json
{
  "commander": "^9.4.1", // 命令行框架
  "inquirer": "^9.1.4", // 交互式问答
  "gogocode": "^1.0.55", // AST 代码转换
  "chalk": "^5.2.0", // 终端美化
  "fs-extra": "^11.1.0" // 文件操作
}
```

#### 为什么选择 GoGoCode 而不是 Babel？

这是我纠结最久的决定。最终选择 GoGoCode 的原因：

1. **API 简洁性**：

```typescript
// GoGoCode - 链式调用，语义清晰
ast
  .find(`import App from './App.vue'`)
  .after(`import router from './router'`)
  .root()
  .find(`app.mount('#app')`)
  .before(`app.use(router)`);

// Babel - 需要遍历节点，代码冗长
traverse(ast, {
  ImportDeclaration(path) {
    // 需要手动判断和插入...
  },
});
```

2. **学习成本**：团队成员可以快速上手
3. **多语言支持**：同时支持 Vue、React、TS、JS

### 2.2 为什么选择 TypeScript？

虽然是 CLI 工具，但我坚持使用 TypeScript：

```typescript
// 类型定义让代码更可维护
export interface IPluginApplyContext {
  options: ICreatorOption;
  answer: IAnwser;
  appDir: string;
}

// 插件函数签名清晰
export const apply = ({ options, answer, appDir }: IPluginApplyContext) => {
  // ...
};
```

好处显而易见：

- IDE 智能提示，开发效率提升
- 编译时发现错误，而非运行时崩溃
- 重构更安全，类型系统会提示所有需要修改的地方

## 三、核心架构设计

### 3.1 整体流程

```
用户输入命令
    ↓
参数校验（项目名是否存在）
    ↓
交互式问答（Vue版本、功能选择）
    ↓
复制基础模板
    ↓
应用插件（并行执行）
    ↓
生成完整项目
```

### 3.2 插件系统设计

这是整个项目最核心的部分。我希望实现：

- 插件独立开发，互不干扰
- 用户按需选择，避免冗余
- 插件并行执行，提升性能

#### 插件结构

每个插件包含两个文件：

```typescript
// plugins/vue-router/index.ts
export { apply } from './apply';
export const choice = {
  name: 'vue-router',
  value: 'vue-router',
};

// plugins/vue-router/apply.ts
export const apply = ({ answer, appDir }: IPluginApplyContext) => {
  if (answer.vueVersion === '2') {
    return vueRouterForVue2(appDir);
  }
  if (answer.vueVersion === '3') {
    return vueRouterForVue3(appDir);
  }
};
```

#### 插件注册与执行

```typescript
// 1. 统一导出所有插件
export * as vueRouter from './vue-router';
export * as vuex from './vuex';
export * as vueI18n from './vue-i18n';
export * as apiDomain from './api-domain';

// 2. 动态生成选择列表
const featurePrompt = () => ({
  name: 'feature',
  type: 'checkbox',
  choices: [...Object.values(plugins).map((plugin) => plugin.choice)],
});

// 3. 并行执行选中的插件
async function resolvePlugin(context: IPluginApplyContext) {
  const funcs = Object.values(plugins)
    .filter((plugin) => answer.feature.includes(plugin.choice.value))
    .map((plugin) => plugin.apply(context));

  return Promise.all(funcs); // 关键：并行执行
}
```

这样设计的好处：

- **扩展性**：新增插件只需在 `plugins/` 下创建目录，自动注册
- **解耦性**：插件之间完全独立
- **性能**：`Promise.all` 并行执行，比串行快数倍

## 四、技术难点与解决方案

### 4.1 难点一：如何精确修改代码？

最初我尝试用字符串拼接：

```typescript
// ❌ 错误示范：字符串拼接
const mainContent = fs.readFileSync('main.ts', 'utf-8');
const newContent = mainContent.replace(
  "import App from './App.vue'",
  "import App from './App.vue'\nimport router from './router'"
);
```

问题：

- 缩进混乱
- 可能匹配到注释中的代码
- 无法处理复杂的代码结构

**解决方案：使用 AST**

```typescript
// ✅ 正确做法：AST 转换
const ast = gogocode.loadFile(path.resolve(appDir, './main.ts'), {});

ast
  .find(`import App from './App.vue'`) // 精确查找
  .after(`import router from './router'`) // 在后面插入
  .root()
  .find(`app.mount('#app')`)
  .before(`app.use(router)`); // 在前面插入

const result = ast.generate();
gogocode.writeFile(result, path.resolve(appDir, './main.ts'));
```

AST 的优势：

- 语法级别的精确匹配
- 自动处理缩进和格式
- 不会误匹配注释或字符串

### 4.2 难点二：Vue2 和 Vue3 的差异处理

Vue2 和 Vue3 的 API 差异很大：

| 特性     | Vue2               | Vue3             |
| -------- | ------------------ | ---------------- |
| 路由     | `new Router()`     | `createRouter()` |
| 状态管理 | `new Vuex.Store()` | `createStore()`  |
| 实例创建 | `new Vue()`        | `createApp()`    |
| 插件注册 | `Vue.use()`        | `app.use()`      |

**解决方案：双模板 + 条件分发**

```typescript
// 1. 维护两套模板
src/templates/
  ├── vue2/
  │   ├── main.js
  │   └── api/index.js
  └── vue3/
      ├── main.ts
      └── api/index.ts

// 2. 根据版本选择模板
const vueTemplateByVersion = `./templates/vue${answer.vueVersion}`
const basicTemplateDir = path.resolve(__dirname, vueTemplateByVersion)

// 3. 插件内部条件分发
export const apply = ({ answer, appDir }: IPluginApplyContext) => {
  if (answer.vueVersion === '2') {
    return vueRouterForVue2(appDir)
  }
  if (answer.vueVersion === '3') {
    return vueRouterForVue3(appDir)
  }
}
```

### 4.3 难点三：API 域名的动态注入

公司有三个项目线，每个项目的 API 域名不同：

```typescript
const DOMAIN_MAP: Record<string, string> = {
  pcgo: 'domainMap',
  chikii: 'chikiiDomainMap',
  mita: 'mitaDomainMap',
};
```

需要在生成的 `api/index.ts` 中自动注入对应的域名配置。

**解决方案：AST 定位插入**

```typescript
const apiDomainForTs = async (projectName: string, appDir: string) => {
  const filePath = './api/index.ts';
  const ast = gogocode.loadFile(path.resolve(appDir, filePath), {});

  // 在 setPBName 函数前后插入代码
  ast
    .find(`setPBName($_$)`)
    .before(`import { ${DOMAIN_MAP[projectName]} } from 'UTILS/constants'`)
    .after(`const apiUrl = ${DOMAIN_MAP[projectName]}[process.env.API_ENV]`);

  const result = ast.generate();
  gogocode.writeFile(result, path.resolve(appDir, filePath));
};
```

生成的代码：

```typescript
// 原始模板
import request, { setPBName } from 'UTILS/Axios';
setPBName(jsonName as INamespace);

// 注入后（以 pcgo 为例）
import request, { setPBName } from 'UTILS/Axios';
import { domainMap } from 'UTILS/constants'; // ← 自动插入
setPBName(jsonName as INamespace);
const apiUrl = domainMap[process.env.API_ENV]; // ← 自动插入
```

## 五、用户体验优化

### 5.1 交互式命令行

使用 `inquirer` 提供友好的交互体验：

```typescript
const answer = await inquirer.prompt([
  {
    name: 'vueVersion',
    type: 'list',
    message: 'Select vue version for your project:',
    choices: [
      { name: 'vue3', value: '3' },
      { name: 'vue2', value: '2' },
    ],
    default: '3',
  },
  {
    name: 'feature',
    type: 'checkbox',
    message: 'Check feature:',
    choices: [
      { name: 'api-domain', value: 'api-domain' },
      { name: 'vue-router', value: 'vue-router' },
      { name: 'vuex', value: 'vuex' },
      { name: 'vue-i18n', value: 'vue-i18n' },
    ],
  },
]);
```

效果：

```bash
? Select vue version for your project: (Use arrow keys)
  ❯ vue3
    vue2

? Check feature: (Press <space> to select)
  ❯ ◉ api-domain
    ◯ vue-router
    ◯ vuex
    ◯ vue-i18n
```

### 5.2 加载动画与状态提示

使用 `ora` 和 `chalk` 美化输出：

```typescript
import ora from 'ora';
import chalk from 'chalk';

const spinner = ora(`create ${chalk.yellow(appName)} by project template`).start();

try {
  await mkdirAsync(appDir);
  await copyFileAsync(basicTemplateDir, appDir);
  await resolvePlugin({ options, answer, appDir });

  spinner.succeed(`create ${chalk.green(appName)} succeed`);
} catch (err) {
  spinner.fail(`${err}`);
}
```

效果：

```bash
⠹ create my-app by project template
✔ create my-app succeed
```

### 5.3 错误处理

```typescript
// 检查项目名是否已存在
if (fs.existsSync(appDir)) {
  console.log(chalk.red(`项目名 ${appName} 已存在，请重新命名`));
  process.exit(1);
}

// 删除旧目录前先备份
await promisify(fs.remove)(appDir);
await sleep(1500); // 等待文件系统完成操作
```

## 六、实际使用效果

### 6.1 使用示例

```bash
# 安装
npm install -g shedcli

# 创建项目
shedcli create my-app -p pcgo

# 交互式选择
? Select vue version: vue3
? Check feature:
  ◉ api-domain
  ◉ vue-router
  ◉ vuex
  ◯ vue-i18n

# 生成完成
✔ create my-app succeed
```

### 6.2 生成的项目结构

```
my-app/
├── api/
│   └── index.ts          # API 封装（已注入域名配置）
├── pb/
│   └── index.json        # Protobuf 定义
├── router/
│   └── index.ts          # 路由配置
├── store/
│   └── index.ts          # Vuex 状态管理
├── views/
│   └── Home.vue          # 首页组件
├── App.vue               # 根组件（已注入 router-view）
├── main.ts               # 入口文件（已注入 router、store）
└── vue.config.js         # Vue CLI 配置
```

### 6.3 效率提升

对比手动创建项目：

| 操作          | 手动       | 使用脚手架 |
| ------------- | ---------- | ---------- |
| 创建项目结构  | 10分钟     | 30秒       |
| 配置路由      | 5分钟      | 自动       |
| 配置状态管理  | 5分钟      | 自动       |
| 配置 API 封装 | 10分钟     | 自动       |
| 配置域名      | 3分钟      | 自动       |
| **总计**      | **33分钟** | **30秒**   |

效率提升 **66倍**！

## 七、踩过的坑

### 7.1 文件系统异步问题

最初代码：

```typescript
// ❌ 问题代码
await fs.remove(appDir);
await fs.mkdir(appDir); // 报错：目录已存在
```

原因：`fs.remove` 虽然返回了 Promise，但文件系统的删除操作可能还没完成。

解决方案：

```typescript
// ✅ 添加延迟
await promisify(fs.remove)(appDir);
await sleep(1500); // 等待文件系统完成
await mkdirAsync(appDir);
```

更好的方案是监听文件系统事件，但为了简单起见，这里使用了延迟。

### 7.2 GoGoCode 的坑

GoGoCode 在处理某些语法时会有问题：

```typescript
// ❌ 这样写会报错
ast.find(`app.use(Lazyload)`).after(`app.use(router)`);

// ✅ 需要先 root() 再查找
ast.find(`app.use(Lazyload)`).root().find(`app.mount('#app')`).before(`app.use(router)`);
```

经验：每次 `find` 后如果要继续查找，记得先 `root()` 回到根节点。

### 7.3 ESM 模块问题

Node.js 的 ESM 模块中没有 `__dirname`：

```typescript
// ❌ 报错：__dirname is not defined
const templateDir = path.resolve(__dirname, './templates');

// ✅ 使用 fileURLToPath
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
```

## 九、总结与思考

### 9.1 技术收获

1. **AST 的强大**：精确修改代码，避免字符串拼接的坑
2. **插件化架构**：解耦、扩展、并行执行
3. **TypeScript 的价值**：类型安全让重构更有信心
4. **用户体验的重要性**：交互式命令行、加载动画、错误提示

### 9.2 工程化思维

开发脚手架工具的本质是：

- **发现重复劳动**：团队每次创建项目都在重复配置
- **抽象共性**：提取通用的项目结构和配置
- **提供灵活性**：通过插件系统支持个性化需求
- **持续优化**：根据使用反馈不断改进

### 9.3 给其他开发者的建议

如果你也想开发类似工具：

1. **先调研**：确认现有工具无法满足需求
2. **小步快跑**：先实现核心功能，再逐步完善
3. **重视体验**：命令行工具也需要好的用户体验
4. **文档先行**：写清楚使用方法和设计思路
5. **开放心态**：接受反馈，持续迭代

## 十、源码与参考

### 10.1 核心代码片段

完整的插件应用逻辑：

```typescript
async function resolvePlugin(context: IPluginApplyContext) {
  const { answer } = context;

  // 1. 过滤出用户选择的插件
  const selectedPlugins = Object.values(plugins).filter((plugin) =>
    answer.feature.includes(plugin.choice.value)
  );

  // 2. 映射为 Promise 数组
  const tasks = selectedPlugins.map((plugin) => plugin.apply(context));

  // 3. 并行执行所有插件
  return Promise.all(tasks);
}
```

### 10.2 技术栈总结

- **语言**：TypeScript
- **命令行**：Commander + Inquirer
- **AST**：GoGoCode
- **文件操作**：fs-extra
- **美化输出**：Chalk + Ora + Figlet

### 10.3 参考资料

- [GoGoCode 官方文档](https://gogocode.io/)
- [Commander.js 文档](https://github.com/tj/commander.js)
- [Inquirer.js 文档](https://github.com/SBoudrias/Inquirer.js)
- [Vue CLI 源码](https://github.com/vuejs/vue-cli)

## 结语

从零打造一个脚手架工具，让我深刻体会到**工程化的价值**。它不仅仅是技术的堆砌，更是对团队效率、代码规范、开发体验的系统性思考。

希望这篇文章能给你带来启发。如果你也在考虑开发类似工具，欢迎交流讨论！
