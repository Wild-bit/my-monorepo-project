# 使用 Verdaccio 搭建私有 npm 仓库：项目实践经验

## 前言

在前端项目中，我们经常会遇到这样的场景：团队内部开发了一些公共组件、工具库或 SDK，希望能被多个项目复用，但又不想发布到公共的 npm registry；或者需要托管一些私有的商业包。这时候，一个私有 npm 仓库就显得尤为重要。

本文将分享我在实际项目中如何使用 **Verdaccio** 搭建私有 npm 仓库，以及如何将 PWA SDK 发布到私有仓库供业务方复用的完整经验。

## 为什么选择 Verdaccio？

在搭建私有 npm 仓库之前，我调研了市面上几种主流方案：

| 方案                     | 特点                                  | 适用场景                   |
| ------------------------ | ------------------------------------- | -------------------------- |
| **Verdaccio**            | 开源、轻量、Docker 部署简单、配置灵活 | 中小型团队、追求快速上手   |
| **Nexus Repository**     | 功能强大、支持多种仓库格式、企业级    | 大型企业、需要复杂权限管理 |
| **CNPMjs**               | 淘宝镜像方案、同步 npm                | 需要搭建镜像的场景         |
| **npm private packages** | 官方方案、付费                        | 不差钱的小团队             |

最终选择 Verdaccio 的原因：

1. **零配置启动**：安装后几乎开箱即用
2. **完全开源**：社区活跃，文档清晰
3. **轻量级**：基于 Node.js，资源占用低
4. **权限控制**：支持用户认证和包级别的访问控制
5. **跨平台**：支持 Docker、K8s、本地部署

## 安装与基础配置

### 1. 环境准备

确保已安装 Node.js（建议 v18+）和 npm：

```bash
node --version
npm --version
```

### 2. 全局安装 Verdaccio

```bash
npm install -g verdaccio

# 验证安装
verdaccio --version
```

### 3. 启动服务

```bash
# 直接启动
verdaccio

# 或者使用 pm2 守护进程
pm2 start verdaccio --name npm-registry
```

Verdaccio 默认会在 `~/.config/verdaccio/` 目录下创建配置文件和存储目录。

### 4. 配置详解

主配置文件位于 `~/.config/verdaccio/config.yaml`：

```yaml
# 监听地址和端口
listen:
  - 0.0.0.0:4873

# 存储路径
storage: ./storage

# 插件目录
plugins: ./plugins

# Web UI 配置
web:
  title: '私有 npm 仓库'
  gravatar: true

# 用户认证配置
auth:
  htpasswd:
    file: ./htpasswd
    # 最大用户数，0 表示不限制
    max_users: 1000

# 上游 registry（用于代理公共包）
uplinks:
  npmjs:
    url: https://registry.npmjs.org/

# 包访问配置
packages:
  # 私有包需要认证才能访问
  '@lance/*':
    access: $authenticated
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

  # 公开包（不需要认证）
  '**':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
```

## 用户管理与权限控制

### 1. 创建用户

```bash
# 添加用户
npm adduser --registry http://localhost:4873

# 输入用户名、密码、邮箱完成注册
```

### 2. 登录已有用户

```bash
npm login --registry http://localhost:4873
```

### 3. 多用户权限管理

在 `config.yaml` 中精细控制每个包的权限：

```yaml
packages:
  # 只允许 admin 角色发布
  '@sdk/*':
    access: $authenticated
    publish: admin reviewer
    unpublish: admin

  # 开发团队可以访问和发布
  '@shared/*':
    access: $authenticated
    publish: $authenticated
    unpublish: $authenticated
```

## 发布 PWA SDK 到私有仓库

### 1. SDK 项目结构

假设我们有一个 PWA SDK 项目：

```
pwa-sdk/
├── src/
│   ├── service-worker.ts      # Service Worker 入口
│   ├── register-sw.ts         # SW 注册逻辑
│   ├── cache-strategy.ts      # 缓存策略
│   └── push-notification.ts   # 推送通知
├── dist/                       # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

### 2. package.json 配置

```json
{
  "name": "@lance/pwa-sdk",
  "version": "1.0.0",
  "description": "企业级 PWA SDK",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["pwa", "service-worker", "cache"],
  "license": "MIT"
}
```

### 3. 发布到私有仓库

```bash
# 切换到 SDK 目录
cd pwa-sdk

# 设置 registry 为私有仓库
npm config set registry http://localhost:4873

# 发布（需要先登录）
npm publish --registry http://localhost:4873

# 输出示例：
# + @lance/pwa-sdk@1.0.0
```

### 4. 版本管理策略

遵循语义化版本（SemVer）：

```bash
# 修复 bug，小版本升级
npm version patch  # 1.0.0 → 1.0.1

# 新增功能，兼容升级
npm version minor  # 1.0.0 → 1.1.0

# 破坏性变更，主版本升级
npm version major  # 1.0.0 → 2.0.0

# 发布新版本
npm publish
```

### 5. 多项目复用

业务项目中使用私有 SDK：

```bash
# 安装
npm install @lance/pwa-sdk --registry http://localhost:4873

# 或者在项目 .npmrc 中配置
echo "@lance:registry=http://localhost:4873" > .npmrc
npm install @lance/pwa-sdk
```

## Docker 部署方案

### 1. Docker Compose 配置

```yaml
version: '3.8'

services:
  verdaccio:
    image: verdaccio/verdaccio:5
    container_name: verdaccio
    ports:
      - '4873:4873'
    volumes:
      - ./config.yaml:/verdaccio/conf/config.yaml
      - ./storage:/verdaccio/storage
      - ./plugins:/verdaccio/plugins
    environment:
      - VERDACCIO_PORT=4873
    restart: unless-stopped
```

### 2. Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name npm.my-company.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://localhost:4873;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. HTTPS 证书配置

```nginx
server {
    listen 443 ssl http2;
    server_name npm.my-company.com;

    ssl_certificate /etc/nginx/ssl/npm.crt;
    ssl_certificate_key /etc/nginx/ssl/npm.key;

    location / {
        proxy_pass http://localhost:4873;
        # ... 其他配置
    }
}
```

## 与 CI/CD 集成

### GitHub Actions 自动发布

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://npm.my-company.com'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 常见问题与解决方案

### 1. 包下载失败

**问题**：业务项目安装时报 404 或 403 错误。

**解决**：

- 确认已登录：`npm whoami --registry http://localhost:4873`
- 检查权限配置：确保包名匹配 `packages` 中的规则
- 清除缓存：`npm cache clean --force`

### 2. 版本冲突

**问题**：多个包依赖同一库的不同版本。

**解决**：

- 使用 npm workspace 统一管理
- 配置 `resolutions` 字段强制统一版本

### 3. 存储空间不足

**问题**：私有包占用过多磁盘空间。

**解决**：

- 配置 `max_body_size` 限制包大小
- 定期清理不使用的旧版本
- 使用 `npm unpublish` 删除废弃包

## 总结

通过 Verdaccio 搭建私有 npm 仓库，我们可以：

1. **安全托管私有包**：无需将敏感代码发布到公共 registry
2. **统一团队依赖**：所有项目使用相同版本的公共库
3. **提升发布效率**：内网环境下发布和安装速度更快
4. **版本可控**：自主管理包的版本发布节奏

## 参考资料

- [Verdaccio 官方文档](https://verdaccio.org/)
- [Semantic Versioning](https://semver.org/)
- [npm scopes 文档](https://docs.npmjs.com/cli/v9/using-npm/scopes)
