## JsBridge是什么

JsBridge作为 **Hybrid** 应用的一个利器，H5页面其实运行在**Navtive**的webView中，webView是移动端提供的JavaScript的环境，他是一种嵌入式浏览器原生应用可以用它来展示网络内容。可与页面JavaScript交互，实现混合开发。所以jsBridge自然也运行在webView中的**JS Content**中，这与原生有运行环境的隔离，所以需要有一种机制实现Native端和Web端的双向通信，这就是JsBridg。

**以JavaScript引擎或Webview容器作为媒介，通过协定协议进行通信，实现Native端和Web端双向通信的一种机制。**

## JsBridge用途

JSBridge 是一种 JS 实现的 Bridge，连接着桥两端的 Native 和 H5。它在 APP 内方便地让 Native 调用 JS，JS 调用 Native ，是双向通信的通道。JSBridge 主要提供了 JS 调用 Native 代码的能力，实现原生功能如查看本地相册、打开摄像头、指纹支付等。

## JsBridge与Native通信的原理

jsBridge就像它的名字的意义一样，是作为Native端（Ios端， Android端等）与非 Native 之间（这里指H5页面）的桥梁，它的核心作用是构建两端之间相互通信的通道。

在H5中JavaScript调用Native的方式有两种：

- **注入API**：注入一个全局对象到JavaScript的window对象中（可以类比于RPC调用）
- **拦截URL Schema**：客户端拦截WebView的请求并做相应的操作（可类比为JSONP）

### 注入API

注入 API 方式的主要原理是，通过 WebView 提供的接口，向 JavaScript 的 Context（window）中注入对象或者方法，让 JavaScript 调用时，直接执行相应的 Native 代码逻辑，达到 JavaScript 调用 Native 的目的，使用该方式时，JS 需要等到 Native 执行完对应的逻辑后才能进行回调里面的操作。
Android 的 Webview 提供了 addJavascriptInterface 方法，支持 Android 4.2 及以上系统：

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
            // 处理 JS 调用，message.body 包含传递的参数
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

先简单的了解一下什么是URL Scheme？URL Scheme是一种类似url的链接，是为了方便app直接互相调用设计的，形式和普通的url近似 ，主要区别是scheme和host一般是自定义的：
如普通的url：

```js
scheme://host:port/path?query#fragment
scheme：协议，比如 http、https
host：主机名或 IP
port：端口，可选
path：资源路径
query：查询参数，可选，比如 ?id=123&sort=asc
fragment：锚点，可选，比如 #section1
```

而url scheme类似这样：

```js
kcnative://go/url?query
```

拦截 URL SCHEME 的主要流程是：Web 端通过某种方式（例如 iframe.src）发送 URL Scheme 请求，之后 Native 拦截到请求并根据 URL SCHEME（包括所带的参数）进行相关操作。

**Android 拦截实现：**

```java
webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (url.startsWith("kcnative://")) {
            // 解析 URL，执行相应的 Native 操作
            handleJSBridgeCall(url);
            return true; // 拦截此请求
        }
        return false; // 正常加载
    }
});
```

**iOS 拦截实现：**

```swift
// WKWebView
func webView(_ webView: WKWebView,
             decidePolicyFor navigationAction: WKNavigationAction,
             decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = navigationAction.request.url,
       url.scheme == "kcnative" {
        // 解析 URL，执行相应的 Native 操作
        handleJSBridgeCall(url)
        decisionHandler(.cancel) // 拦截此请求
        return
    }
    decisionHandler(.allow) // 正常加载
}
```

### 两种方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 注入 API | • 速度快，直接调用<br>• 可以同步返回结果 | • Android 4.2 以下有安全漏洞<br>• iOS 需要 WKWebView（iOS 8+） | 高频调用、需要同步结果 |
| URL Scheme | • 兼容性好<br>• 安全性高<br>• 实现简单 | • URL 长度限制（iOS 约 2MB）<br>• 异步调用，需要 callback 机制<br>• 性能略低 | 低频调用、传输数据量小 |

> 实际项目中，通常结合两种方式：Android 使用 `prompt`（同步）+ URL Scheme（异步），iOS 使用 URL Scheme。

**那么调用 Native 功能时 Callback 怎么实现的？**

对于 JSBridge 的 Callbac，可以用JSONP的机制实现：

> 当发送 JSONP 请求时，url 参数里会有 callback 参数，其值是 当前页面唯一 的，而同时以此参 数值为 key 将回调函数存到 window 上，随后，服务器返回 script 中，也会以此参数值作为句柄，调>用相应的回调函数。

1.在H5中注入一个callback方法，放在window对象或者与Native端相绑定的对象中

```TypeScript
/**
 *
 * @param callbackId
 * @param obj
 * 客户端通知webviw的callback
 */
const onCallback = function (callbackId: number, obj: any) {
    if (ApiBridge.callbackCache[callbackId]) {
        console.log('onCallback调用',callbackId);
        console.log(ApiBridge.callbackCache[callbackId]);
        ApiBridge.callbackCache[callbackId](obj)
    }
}
//预先把callback存到一个callbackCache数组或者对象中，通过自增的方式确定callbackId
```

2.然后把callback对应的id通过Url Schema传到Native端

```TypeScript
const callNative = function (clz: string, method: string, args: any, callback?: any) {
    let msgJson = {
        clz,
        method,
        args,
    }
    if (args != undefined) msgJson.args = args
    if (callback) {
        const callbackId = getCallbackId()
        ApiBridge.callbackCache[callbackId] = callback
        if (msgJson.args) {
            msgJson.args.callbackId = callbackId.toString()
        } else {
            msgJson.args = {
                callbackId: callbackId.toString(),
            }
        }
    }

    if (browser.versions.ios) {

        if (ApiBridge.bridgeIframe == undefined) {
            bridgeCreate()
        }
        ApiBridge.msgQueue.push(msgJson)
        if (!ApiBridge.processingMsg) ApiBridge.bridgeIframe!.src = 'native://go'

        window.initJSBridge = true
    } else if (browser.versions.android) {

        var ua = window.navigator.userAgent.toLowerCase()
        window.initJSBridge = true
        // android
        // prompt传参给Native
        return prompt(JSON.stringify(msgJson))
    }
}
```

Native 拦截到 WebView 的请求，并通过与前端约定好的 Url Schema 判断是否是 JSBridge 调用。

3.Native 解析出前端带上的 callback，并使用下面方式调用 callback

**Android 调用 JS：**

```java
// 方式1：loadUrl（会刷新页面）
webView.loadUrl(String.format("javascript:window.onCallback(%s, %s)",
    callbackId, jsonResult));

// 方式2：evaluateJavascript（推荐，Android 4.4+）
webView.evaluateJavascript(
    String.format("window.onCallback(%s, %s)", callbackId, jsonResult),
    new ValueCallback<String>() {
        @Override
        public void onReceiveValue(String value) {
            // JS 执行结果
        }
    }
);
```

**iOS 调用 JS：**

```swift
// WKWebView
webView.evaluateJavaScript("window.onCallback(\(callbackId), \(jsonResult))") { result, error in
    if let error = error {
        print("JS 执行错误: \(error)")
    }
}
```

通过上面几步就可以实现 JavaScript 到 Native 的双向通信。

## Native 调用 JS

除了 JS 调用 Native 的 callback 场景，Native 也可以主动调用 JS 方法，比如推送消息通知、状态更新等。

**使用场景：**
- 推送消息到达，通知 H5 更新消息列表
- 网络状态变化，通知 H5 切换 UI
- 用户信息更新，同步到 H5 页面

**实现方式：**

```js
// H5 端注册全局方法
window.onNativeEvent = function(eventName, data) {
    switch(eventName) {
        case 'networkChange':
            // 处理网络状态变化
            break;
        case 'userInfoUpdate':
            // 处理用户信息更新
            break;
    }
}
```

```java
// Android 端调用
webView.evaluateJavascript(
    "window.onNativeEvent('networkChange', {status: 'wifi'})",
    null
);
```

```swift
// iOS 端调用
webView.evaluateJavaScript(
    "window.onNativeEvent('networkChange', {status: 'wifi'})"
)
```

## 完整实现示例

### 浏览器环境检测

```typescript
const browser = {
    versions: (function() {
        const u = navigator.userAgent;
        return {
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
            android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1,
        };
    })()
};
```

### 创建 iframe 桥接（iOS）

```typescript
const bridgeCreate = function() {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    ApiBridge.bridgeIframe = iframe;
};
```

### 生成唯一 callbackId

```typescript
let callbackId = 0;
const getCallbackId = function() {
    return ++callbackId;
};
```

### 核心代码实现

```typescript
interface ApiBridgeType {
    callbackCache: { [key: number]: Function };
    msgQueue: any[];
    processingMsg: boolean;
    bridgeIframe?: HTMLIFrameElement;
}

const ApiBridge: ApiBridgeType = {
    callbackCache: {},
    msgQueue: [],
    processingMsg: false,
};

(function (window) {
    let global = window;

    const jsBridgeClient = {
        getNativeData,
        setNativeData,
        doAction,
    };

    global.jsBridgeClient = jsBridgeClient;

    // 初始化完成回调
    onBridgeInitComplete(function (configs: any) {
        console.log('JSBridge 初始化完成', configs);
    });
})(window);
```

## JsBridge接口的抽象

```ts
getNativeData(method:string,params:{},callback) 从客户端获取数据
setNativeData(method:string,params:{key:value})H5告诉客户端一些数据 ,客户端执行相应操作
doAction(method:string,params:{},calllback:any)H5调用客户端组件或方法
```

使用示例：

```ts
// 获取用户信息
jsBridge.getNativeData('getUserInfo', (data: any) => {
    console.log(data)
})

// 设置导航栏背景色
jsBridge.setNativeData('setWebBackColor', { back_color: 'red' })

// 调用原���购买功能
jsBridge.doAction('buyGoods', { goods_info: state.goodsInfo, buy_num: 1 })

// 调用原生分享
jsBridge.doAction('showShareDialog', {
    is_share: 1,
    share_type: 1,
    share_url: '分享链接',
    thumb: '项目链接',
    content: '分享内容',
    share_title: '分享标题！',
})
```

## 实际应用场景

### 1. 登录态同步

```typescript
// H5 获取 Native 的登录态
jsBridge.getNativeData('getToken', (data: { token: string, userId: string }) => {
    // 将 token 存储到本地，用于后续 API 调用
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
});

// Native 监听登录状态变化，通知 H5
window.onNativeEvent = function(eventName, data) {
    if (eventName === 'loginStatusChange') {
        if (data.isLogin) {
            // 用户登录，刷新页面数据
            location.reload();
        } else {
            // 用户登出，跳转到登录页
            location.href = '/login';
        }
    }
};
```

### 2. 原生分享

```typescript
jsBridge.doAction('share', {
    title: '分享标题',
    content: '分享内容描述',
    url: 'https://example.com/share',
    imageUrl: 'https://example.com/share.jpg',
    platform: 'wechat' // wechat, moments, qq, weibo
}, (result: { success: boolean, message: string }) => {
    if (result.success) {
        Toast.show('分享成功');
    } else {
        Toast.show('分享失败：' + result.message);
    }
});
```

### 3. 调用原生支付

```typescript
jsBridge.doAction('pay', {
    orderId: '202403220001',
    amount: 99.00,
    payType: 'wechat' // wechat, alipay
}, (result: { success: boolean, orderId: string }) => {
    if (result.success) {
        // 支付成功，跳转到订单详情
        location.href = `/order/${result.orderId}`;
    } else {
        Toast.show('支付失败');
    }
});
```

### 4. 页面跳转控制

```typescript
// 跳转到原生页面
jsBridge.doAction('navigateTo', {
    page: 'UserProfile',
    params: { userId: '123456' }
});

// 关闭当前 WebView
jsBridge.doAction('closePage');

// 隐藏导航栏
jsBridge.setNativeData('setNavigationBarHidden', { hidden: true });
```

### 5. 埋点上报

```typescript
// 页面浏览埋点
jsBridge.setNativeData('trackPageView', {
    page: 'ProductDetail',
    productId: '12345',
    timestamp: Date.now()
});

// 事件埋点
jsBridge.setNativeData('trackEvent', {
    eventName: 'click_buy_button',
    params: {
        productId: '12345',
        price: 99.00
    }
});
```

## 错误处理与超时机制

```typescript
const callNativeWithTimeout = function(
    method: string,
    params: any,
    callback?: Function,
    timeout: number = 5000
) {
    let timeoutId: number;
    let hasResponse = false;

    const wrappedCallback = function(data: any) {
        if (!hasResponse) {
            hasResponse = true;
            clearTimeout(timeoutId);
            callback?.(data);
        }
    };

    // 设置超时
    timeoutId = window.setTimeout(() => {
        if (!hasResponse) {
            hasResponse = true;
            console.error(`JSBridge 调用超时: ${method}`);
            callback?.({ error: 'timeout', message: '调用超时' });
        }
    }, timeout);

    // 调用 Native
    callNative('Bridge', method, params, wrappedCallback);
};
```

## 版本兼容性处理

```typescript
// 检查 JSBridge 是否可用
const isJSBridgeAvailable = function(): boolean {
    if (browser.versions.ios) {
        return !!(window as any).webkit?.messageHandlers?.nativeApiBridge;
    } else if (browser.versions.android) {
        return !!(window as any).nativeApiBridge;
    }
    return false;
};

// 安全调用
const safeCallNative = function(method: string, params: any, callback?: Function) {
    if (!isJSBridgeAvailable()) {
        console.warn('JSBridge 不可用，使用降级方案');
        // 降级处理，比如使用 H5 实现
        callback?.({ error: 'unavailable', message: 'JSBridge 不可用' });
        return;
    }

    callNative('Bridge', method, params, callback);
};
```

## 总结

JSBridge 是 Hybrid 应用开发的核心技术，通过它可以让 H5 页面调用原生能力，实现更好的用户体验。在实际项目中需要注意：

1. **安全性**：避免使用有漏洞的 API，做好参数校验
2. **兼容性**：处理不同系统版本的差异，提供降级方案
3. **性能**：避免高频调用，合理使用缓存
4. **错误处理**：添加超时机制和错误回调
5. **调试**：提供完善的日志输出，方便排查问题
