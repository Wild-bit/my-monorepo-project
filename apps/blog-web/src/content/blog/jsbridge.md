## JsBridge是什么

JsBridge作为 **Hybrid** 应用的一个利器，H5页面其实运行在**Native**的webView中，webView是移动端提供的JavaScript的环境，他是一种嵌入式浏览器原生应用可以用它来展示网络内容。可与页面JavaScript交互，实现混合开发。所以jsBridge自然也运行在webView中的**JS Content**中，这与原生有运行环境的隔离，所以需要有一种机制实现Native端和Web端的双向通信，这就是JsBridge。

**以JavaScript引擎或Webview容器作为媒介，通过协定协议进行通信，实现Native端和Web端双向通信的一种机制。**

## JsBridge用途

JSBridge 是一种 JS 实现的 Bridge，连接着桥两端的 Native 和 H5。它在 APP 内方便地让 Native 调用 JS，JS 调用 Native ，是双向通信的通道。JSBridge 主要提供了 JS 调用 Native 代码的能力，实现原生功能如查看本地相册、打开摄像头、指纹支付等。

## JsBridge与Native通信的原理

jsBridge就像它的名字的意义一样，是作为Native端（Ios端、Android端等）与非 Native 之间（这里指H5页面）的桥梁，它的核心作用是构建两端之间相互通信的通道。

在H5中JavaScript调用Native的方式有两种：

- **注入API**：注入一个全局对象到JavaScript的window对象中（可以类比于RPC调用）
- **拦截URL Schema**：客户端拦截WebView的请求并做相应的操作（可类比为JSONP）

### 注入API

注入 API 方式的主要原理是，通过 WebView 提供的接口，向 JavaScript 的 Context（window）中注入对象或者方法，让 JavaScript 调用时，直接执行相应的 Native 代码逻辑，达到 JavaScript 调用 Native 的目的。

**Android 实现：**

```java
gpcWebView.addJavascriptInterface(new JavaScriptInterface(), "nativeApiBridge");
public class JavaScriptInterface {
    Context mContext;

  JavaScriptInterface(Context c) {
    mContext = c;
  }

  @JavascriptInterface  // Android 4.2+ 必须添加此注解
  public void share(String webMessage){
    // Native 逻辑
  }
}
```

> 注意：Android 4.2 以下版本的 `addJavascriptInterface` 存在安全漏洞，恶意网页可通过反射调用 Java 方法，因此建议只支持 4.2 及以上版本。

**iOS 实现：**

```swift
// WKWebView 配置
let config = WKWebViewConfiguration()
let userContentController = WKUserContentController()
userContentController.add(self, name: "nativeApiBridge")
config.userContentController = userContentController

let webView = WKWebView(frame: .zero, configuration: config)

// 实现 WKScriptMessageHandler 协议
extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController,
                              didReceive message: WKScriptMessage) {
        if message.name == "nativeApiBridge" {
            let params = message.body
            // Native 逻辑
        }
    }
}
```

**前端调用方式：**

```js
// Android
window.nativeApiBridge.share(message);

// iOS
window.webkit.messageHandlers.nativeApiBridge.postMessage(message);
```

### 拦截URL Scheme

URL Scheme是一种类似url的链接，是为了方便app直接互相调用设计的，形式和普通的url近似，主要区别是scheme和host一般是自定义的。

如普通的url：`scheme://host:port/path?query#fragment`

而自定义的url scheme类似这样：

```
kcnative://go?query
```

拦截 URL Scheme 的主要流程是：Web 端通过某种方式（例如 iframe.src）发送 URL Scheme 请求，之后 Native 拦截到请求并根据 URL Scheme（包括所带的参数）进行相关操作。

**iOS 拦截实现：**

```swift
func webView(_ webView: WKWebView,
             decidePolicyFor navigationAction: WKNavigationAction,
             decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = navigationAction.request.url,
       url.scheme == "kcnative" {
        handleJSBridgeCall(url)
        decisionHandler(.cancel) // 拦截此请求
        return
    }
    decisionHandler(.allow)
}
```

**Android 拦截实现：**

Android 不走 iframe.src，而是利用 `prompt()` 来传递消息。`window.prompt()` 本来是浏览器弹出输入框的 API，但在 WebView 里，Android 可以拦截它：

```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean onJsPrompt(WebView view, String url,
                               String message,  // 拿到 JSON 字符串
                               String defaultValue,
                               JsPromptResult result) {
        handleJSBridgeCall(message)
        result.confirm("")  // 立即返回，解除 JS 阻塞
        return true
    }
});
```

JS 侧通过 `prompt(JSON.stringify(msgJson))` 发送消息，该调用是同步的，会短暂阻塞 JS 线程直到 Native 返回（通常立即返回空字符串）。

### 两种方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 注入 API | 速度快，直接调用 | Android 4.2 以下有安全漏洞 | 高频调用 |
| URL Scheme / prompt | 兼容性好，安全性高 | prompt 会短暂阻塞主线程 | 通用场景 |

> 实际项目中：Android 使用 `prompt` 发送消息，iOS/Flutter 使用 `iframe.src` 修改触发 URL Scheme 拦截。

## Callback 机制：JS 调用 Native 拿数据

### 核心：callbackId + callbackCache

不管是 Android 还是 iOS，**发消息** 只是把调用请求送到 Native，真正的数据结果需要通过回调机制返回。整个回调机制的基础是一个「回调注册表」：

```typescript
const ApiBridge = {
    callbackCache: [],    // 以 callbackId 为 key 存储回调函数
    callbackId: 0,        // 全局后自增 id，确保唯一性（从 0 开始）
    msgQueue: [],         // iOS/Flutter 消息队列
    processingMsg: false, // iOS/Flutter 消息处理互斥锁
}

const getCallbackId = function(): number {
    return ApiBridge.callbackId++  // 后自增：先返回当前值再加1
}
```

**完整调用流程：**

```
① JS 调用 callNative，生成唯一 callbackId
② 将 callback 存入 callbackCache[callbackId]
③ 将 callbackId 附加到参数中，发送给 Native（Android: prompt，iOS: iframe.src）
④ Native 执行操作（可能是异步的：网络请求、读数据库等）
⑤ Native 执行完毕，调用 window.onCallback(callbackId, result)
⑥ onCallback 从 callbackCache 取出对应函数并执行
```

```typescript
const onCallback = function (callbackId: number, obj: any) {
    if (ApiBridge.callbackCache[callbackId]) {
        ApiBridge.callbackCache[callbackId](obj)
    }
}
```

**对 H5 业务代码来说**：调用 Native 方法后，**所有依赖返回数据的逻辑都必须写在回调函数里**。

```typescript
// ❌ 这样拿不到数据，callNative 没有返回值
const data = kerkee.getNativeData('getPlayingRoomInfo', {}, callback)

// ✅ 只能在回调里处理
kerkee.getNativeData('getPlayingRoomInfo', {}, (data: any) => {
    // Native 返回后才执行到这里
    console.log(data)
    updateRoomUI(data)  // 依赖数据的操作都写在这里
})
```

### Android：prompt 发消息，onCallback 回结果

`prompt()` 只解决了「消息怎么传给 Native」这一步，Native 内部操作依然可能是异步的：

```
① JS: prompt(msgJson)       ← 同步，把消息送出去，立刻返回 ""
② JS: 继续执行后面代码      ← 不等结果，没有阻塞

   ... Native 在做网络请求、查数据库等异步操作 ...

③ Native 完成，调用 window.onCallback(id, result)
④ JS: callbackCache[id](result) 被执行 ← 数据在这里
```

> `prompt()` 是「发消息」的手段，`onCallback` 是「接结果」的手段，两者是不同阶段的事。

### iOS/Flutter：iframe.src + 消息队列

iOS 通过修改隐藏 iframe 的 src 触发 URL Scheme 拦截。但如果连续快速调用，直接改 src 会丢消息，因此实际实现使用**消息队列 + 互斥锁**：

```typescript
// 发消息时：推入队列，加锁防止重复触发
ApiBridge.msgQueue.push(msgJson)
if (!ApiBridge.processingMsg) {
    ApiBridge.bridgeIframe!.src = 'kcnative://go'
}

// Native 拦截到请求后，主动调这两个方法取消息：
const prepareProcessingMessages = function() {
    ApiBridge.processingMsg = true  // 加锁
}

const fetchMessages = function() {
    if (ApiBridge.msgQueue.length > 0) {
        const messages = JSON.stringify(ApiBridge.msgQueue)
        ApiBridge.msgQueue.length = 0  // 批量取出，清空队列
        return messages
    }
    ApiBridge.processingMsg = false  // 队列空了，释放锁
    return null
}
```

**关键设计：** `fetchMessages` 批量取出所有消息，减少通信次数；`processingMsg` 互斥锁保证高并发时消息不丢失。

### 并发调用的正确性

当多个 JSBridge 调用同时发出时，`callbackId` 自增机制保证回调不会串扰：

```
调用 A: callbackId=0, callback_A 存入 cache[0]
调用 B: callbackId=1, callback_B 存入 cache[1]

Native 先完成 B → window.onCallback(1, resultB) → 执行 callback_B
Native 再完成 A → window.onCallback(0, resultA) → 执行 callback_A
```

即使 Native 乱序返回，也能正确匹配到对应的回调函数。

## Native 主动调用 JS

除了 JS 发起请求等待回调，Native 也可以主动向 H5 推送事件，比如推送消息到达、网络状态变化、登录状态更新等。实际项目中通过 `webviewCallback` 实现：

```typescript
interface callBackOption {
    event: string  // 事件名，如 'loginStatusChange'
    code: number   // 状态码，0 表示成功
    msg: string
    data: any
}

const webviewCallback = function(options: callBackOption, isHandleH5?: boolean) {
    // isHandleH5 为 true 时，H5 处理完后反向通知 Native
    isHandleH5 && callNative('ApiBridge', 'webviewCallback', options)
}
```

**`onCallback` 与 `webviewCallback` 的区别：**

| 机制 | 触发方 | 场景 |
|------|--------|------|
| `onCallback(id, result)` | Native 响应 JS 请求 | JS 调用 Native 后的异步回调 |
| `webviewCallback(options)` | Native 主动推送 | 推送通知、状态变更、事件广播 |

## JsBridge 接口抽象

实际项目中，JSBridge 通常封装为三个语义清晰的方法：

```ts
getNativeData(method, params, callback)  // 从 Native 获取数据
setNativeData(method, params)            // 通知 Native 执行操作，无需返回值
doAction(method, params, callback)       // 调用 Native 组件或功能
```

**使用示例：**

```typescript
// 获取房间信息（需要回调拿数据）
jsBridgeClient.getNativeData('getPlayingRoomInfo', {}, (data: any) => {
    console.log(data.roomInfo)
})

// 设置导航栏背景色（不需要返回值）
jsBridgeClient.setNativeData('setWebBackColor', { back_color: 'red' })

// 调用原生支付（有结果回调）
jsBridgeClient.doAction('nativePay', {
    orderId: '202403220001',
    payType: 1,
}, (result: { success: boolean }) => {
    if (result.success) {
        location.href = `/order/success`
    }
})

// 调用原生分享（无需回调）
jsBridgeClient.doAction('showShareDialog', {
    is_share: 1,
    share_type: 1,
    share_url: 'https://example.com/share',
    share_title: '分享标题',
    content: '分享内容',
})
```

## 实际应用场景

### 登录态同步

```typescript
// H5 获取 Native 的登录态
jsBridgeClient.getNativeData('getUserInfo', {}, (data: { userInfo: string }) => {
    const info = JSON.parse(data.userInfo)
    localStorage.setItem('token', info.token)
    localStorage.setItem('userId', info.userId)
})

// Native 监听登录状态变化，通过 webviewCallback 主动通知 H5
window.ApiBridge.webviewCallback = function(options) {
    if (options.event === 'loginStatusChange') {
        if (options.data.isLogin) {
            location.reload()
        } else {
            location.href = '/login'
        }
    }
}
```

### 页面控制

```typescript
// 关闭当前 WebView
jsBridgeClient.doAction('finishWebView', {})

// 隐藏导航栏返回按钮
jsBridgeClient.setNativeData('setBackShow', { is_show: false })

// 设置横屏
jsBridgeClient.setNativeData('setScreenOrientation', { orientation: 1 })
```

### 埋点上报

```typescript
jsBridgeClient.doAction('reportData', {
    id: 'click_buy_button',
    mode: 2, // 0: 只上报 Firebase, 1: 只上报自定义罗盘, 2: 两者都上报
    params: { productId: '12345', price: 99.00 }
})
```

## 业务层增强：Promise 封装（可选）

JSBridge 核心库本身只提供 callback 机制，**Promise 封装是业务层的可选增强**，不是 JSBridge 库本身的功能。

**什么时候值得封装？** 当需要串行依赖多个 Native 数据时，callback 嵌套会变得难以维护：

```typescript
// 没有 Promise：三层嵌套
getNativeData('getUserInfo', {}, (user) => {
    getNativeData('getRoomInfo', {}, (room) => {
        getNativeData('getGameInfo', {}, (game) => {
            // 终于能用了...
        })
    })
})

// 有 Promise：线性清晰
const user = await callNativeAsync('getUserInfo', {})
const room = await callNativeAsync('getRoomInfo', {})
const game = await callNativeAsync('getGameInfo', {})
```

**封装原理**：Promise 的 `resolve` 本质上就是一个普通函数引用，可以存入 `callbackCache`，等 Native 回调时取出执行。JSBridge 感知不到任何变化，它依然通过 `window.onCallback(id, result)` 回传。

```
① new Promise(resolve => { callbackCache[id] = resolve })
   → resolve 存入 cache，Promise 处于 pending 状态

② await p
   → 发现 pending，当前函数挂起，但 JS 主线程不阻塞

③ Native 完成 → window.onCallback(id, data) → resolve(data)
   → Promise 变为 fulfilled，await 后面的代码进入微任务队列执行
```

**完整封装：**

```typescript
const callNativeAsync = function<T>(
    method: string,
    params: any,
    timeout: number = 5000
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error(`JSBridge 调用超时: ${method}`))
        }, timeout)

        callNative('jsBridgeClient', method, params, (data: T) => {
            clearTimeout(timeoutId)
            resolve(data)
        })
    })
}

// 业务侧使用
async function loadPageData() {
    try {
        const user = await callNativeAsync<{ userInfo: string }>('getUserInfo', {})
        const room = await callNativeAsync<{ roomInfo: string }>('getRoomInfo', {})
        renderPage(user, room)
    } catch (err) {
        console.error('获取数据失败', err)
    }
}
```

> 大多数业务场景（触发分享、调起支付、设置导航栏等）用 callback 就够了，不需要 Promise 化。只有需要串行等待多个 Native 结果时，Promise 封装才能体现价值。

## 总结

JSBridge 是 Hybrid 应用开发的核心技术，核心是一套「发消息 + 回调注册」的机制：

1. **发消息**：Android 用 `prompt()`，iOS/Flutter 用 `iframe.src` 修改触发 URL Scheme
2. **回结果**：不管哪个平台，都通过 `window.onCallback(callbackId, result)` 异步回传
3. **callback 是基础**：业务侧所有依赖 Native 数据的操作，必须写在回调函数里
4. **Promise 是增强**：业务层可自行包装，适合需要串行等待多个结果的场景
5. **并发安全**：`callbackId` 自增保证多个并发调用的回调不串扰
6. **iOS 消息队列**：消息队列 + 互斥锁防止高并发时消息丢失
