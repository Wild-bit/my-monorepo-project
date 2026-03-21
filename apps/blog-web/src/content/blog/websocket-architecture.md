# WebSocket 实时通信架构设计

## 引言

在现代 Web 应用中，实时通信已成为刚需。无论是聊天应用、在线协作工具，还是实时数据监控，都离不开 WebSocket 技术。

## WebSocket 基础

### 什么是 WebSocket？

WebSocket 是一种在单个 TCP 连接上提供全双工通信的协议。与 HTTP 不同，WebSocket 允许服务器主动向客户端推送数据。

### 与 HTTP 的对比

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| 连接方式 | 请求-响应 | 持久连接 |
| 服务器推送 | 不支持 | 支持 |
| 数据格式 | 文本/二进制 | 文本/二进制 |
| 开销 | 每次请求都有头部 | 握手后无头部开销 |

## 架构设计

### 1. 连接管理

#### 连接池

```typescript
class ConnectionPool {
  private connections: Map<string, WebSocket> = new Map();

  add(id: string, ws: WebSocket): void {
    this.connections.set(id, ws);
  }

  remove(id: string): void {
    this.connections.delete(id);
  }

  broadcast(message: Message): void {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}
```

#### 心跳机制

保持连接活跃，防止中间件（如 Nginx）断开空闲连接：

```typescript
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 60000;

class HeartbeatManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  start(userId: string, ws: WebSocket): void {
    const timer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);

    this.timers.set(userId, timer);
  }

  stop(userId: string): void {
    const timer = this.timers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(userId);
    }
  }
}
```

### 2. 消息协议设计

#### 消息格式

```typescript
interface Message {
  type: string;      // 消息类型
  payload: unknown;  // 消息内容
  timestamp: number; // 时间戳
  userId?: string;   // 发送者 ID
  traceId?: string;  // 追踪 ID
}
```

#### 消息类型定义

```typescript
enum MessageType {
  // 基础消息
  PING = 'ping',
  PONG = 'pong',

  // 聊天消息
  CHAT_MESSAGE = 'chat:message',
  CHAT_TYPING = 'chat:typing',
  CHAT_READ = 'chat:read',

  // 通知消息
  NOTIFICATION = 'notification',
  SYSTEM_MESSAGE = 'system:message',

  // 协作消息
  PRESENCE_UPDATE = 'presence:update',
  CURSOR_MOVE = 'cursor:move',
  DOCUMENT_CHANGE = 'document:change',
}
```

### 3. 断线重连策略

#### 指数退避重连

```typescript
class ReconnectionManager {
  private maxRetries = 10;
  private baseDelay = 1000;
  private maxDelay = 30000;

  getDelay(retryCount: number): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, retryCount),
      this.maxDelay
    );
    // 添加随机抖动
    return delay + Math.random() * 1000;
  }

  shouldRetry(retryCount: number): boolean {
    return retryCount < this.maxRetries;
  }
}
```

#### 客户端重连实现

```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectManager = new ReconnectionManager();
  private retryCount = 0;

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onclose = () => {
      if (this.reconnectManager.shouldRetry(this.retryCount)) {
        const delay = this.reconnectManager.getDelay(this.retryCount);
        setTimeout(() => {
          this.retryCount++;
          this.connect(url);
        }, delay);
      }
    };

    this.ws.onopen = () => {
      this.retryCount = 0; // 重置重试计数
    };
  }
}
```

### 4. 消息可靠性

#### 消息确认机制

```typescript
interface AckMessage {
  id: string;         // 消息 ID
  type: string;
  payload: unknown;
}

interface AckResponse {
  originalId: string;
  status: 'success' | 'failed';
  error?: string;
}

class ReliableMessenger {
  private pendingMessages: Map<string, { resolve: Function; reject: Function }> = new Map();
  private timeout = 5000;

  async send(ws: WebSocket, message: AckMessage): Promise<AckResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingMessages.delete(message.id);
        reject(new Error('Message timeout'));
      }, this.timeout);

      this.pendingMessages.set(message.id, { resolve, reject: () => {
        clearTimeout(timer);
        reject();
      }});

      ws.send(JSON.stringify(message));
    });
  }

  handleAck(response: AckResponse): void {
    const pending = this.pendingMessages.get(response.originalId);
    if (pending) {
      pending.resolve(response);
      this.pendingMessages.delete(response.originalId);
    }
  }
}
```

## 性能优化

### 1. 消息压缩

使用 permessage-deflate 扩展：

```typescript
const server = new WebSocket.Server({
  port: 8080,
  perMessageDeflate: {
    level: 6,           // 压缩级别 0-9
    memLevel: 8,        // 内存级别
    threshold: 1024      // 超过 1KB 启用压缩
  }
});
```

### 2. 连接复用

在支持 HTTP/2 的环境下，可以复用连接减少 TCP 连接数。

### 3. 消息批处理

合并高频消息，减少网络往返：

```typescript
class MessageBatcher {
  private queue: Message[] = [];
  private timer: NodeJS.Timeout | null = null;
  private batchInterval = 100; // 100ms 批处理间隔

  add(message: Message): void {
    this.queue.push(message);
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchInterval);
    }
  }

  private flush(): void {
    if (this.queue.length > 0) {
      this.broadcast({
        type: 'batch',
        payload: this.queue.splice(0)
      });
      this.timer = null;
    }
  }
}
```

## 安全考虑

### 1. 认证与授权

```typescript
// 握手阶段验证 Token
wss.on('connection', (ws, req) => {
  const token = extractToken(req);
  const user = verifyToken(token);

  if (!user) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  ws.userId = user.id;
  ws.userRole = user.role;
});
```

### 2. 消息过滤

```typescript
function filterMessage(message: Message, user: User): boolean {
  // 检查用户是否有权限查看此消息
  if (message.scope === 'private' && message.recipientId !== user.id) {
    return false;
  }

  // 检查用户是否在目标房间
  if (message.roomId && !user.rooms.includes(message.roomId)) {
    return false;
  }

  return true;
}
```

## 总结

构建一个可靠的实时通信系统需要考虑很多方面：

1. **连接管理**：优雅处理连接和断开
2. **断线重连**：使用指数退避策略
3. **消息可靠性**：确认机制确保消息送达
4. **性能优化**：压缩、批处理、连接复用
5. **安全**：认证、授权、消息过滤

只有将这些方面都考虑到位，才能构建出生产级别的实时通信系统。
