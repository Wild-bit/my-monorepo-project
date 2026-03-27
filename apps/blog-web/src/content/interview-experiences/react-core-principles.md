# React 核心原理整理

> Hooks 原理 · Fiber 架构 · 生命周期 · 面试备考

---

## 一、为什么引入 Hooks？

**Class 组件的三大痛点**：

**1. 逻辑复用困难**
```jsx
// 复用有状态逻辑，只能用 HOC 或 render props，造成"嵌套地狱"
<WithAuth>
  <WithTheme>
    <WithData>
      <MyComponent />
    </WithData>
  </WithTheme>
</WithAuth>
```

**2. 生命周期导致逻辑分散**
```jsx
class MyComponent extends React.Component {
  componentDidMount() {
    // 订阅事件
    window.addEventListener('resize', this.handleResize)
    // 请求数据
    fetchData()
  }
  componentWillUnmount() {
    // 清理事件 —— 和订阅逻辑分离在两个生命周期里
    window.removeEventListener('resize', this.handleResize)
  }
}
```

**3. this 指向问题**
```jsx
// Class 中必须手动绑定 this，容易出错
this.handleClick = this.handleClick.bind(this)
```

**Hooks 的解决方案**：
```jsx
// 同一逻辑放在一起，可抽离成自定义 Hook 复用
function useWindowSize() {
  const [size, setSize] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setSize(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)  // 清理就在订阅旁边
  }, [])
  return size
}
```

---

## 二、Fiber 架构原理

### 2.1 为什么要有 Fiber？

React 16 之前（Stack Reconciler）的问题：

```
虚拟 DOM diff 是递归执行的，一旦开始就无法中断
→ 如果组件树很深，diff 可能占用主线程 >16ms
→ 浏览器无法响应用户输入和动画，出现卡顿
```

### 2.2 Fiber 是什么？

**Fiber = 可中断的工作单元**

每个 React 元素对应一个 Fiber 节点，组成 Fiber 树。

```
Fiber 节点包含：
  - type: 组件类型
  - stateNode: 真实 DOM 节点
  - child / sibling / return: 树结构指针
  - pendingProps / memoizedProps: 新旧 props
  - effectTag: 需要执行的 DOM 操作（插入/更新/删除）
```

### 2.3 双缓冲机制（Double Buffering）

React 同时维护两棵 Fiber 树：

```
current tree    →  当前屏幕显示的内容
workInProgress  →  正在后台构建的新树

构建完成后，两棵树互换（current = workInProgress）
→ 切换是瞬间的，用户看不到中间状态
```

### 2.4 两个阶段

```
Render 阶段（可中断）
  → 对比新旧 Fiber 树，打上 effectTag 标记
  → 纯计算，不涉及 DOM 操作
  → 可以被更高优先级任务打断、暂停、恢复

Commit 阶段（不可中断）
  → 遍历 effectList，执行真实 DOM 操作
  → 必须一次性完成，保证 UI 一致性
```

### 2.5 时间切片（Time Slicing）

```
Fiber 把 diff 工作拆成小单元
→ 每执行完一个 Fiber 节点，检查是否还有剩余时间（deadline）
→ 没时间了 → 暂停，把控制权还给浏览器
→ 浏览器空闲时 → 继续执行剩余 Fiber 节点
```

利用的浏览器 API：`requestIdleCallback`（React 自己实现了 scheduler 包模拟它）

---

## 三、常用 Hook 原理

### 3.1 Hook 存储在哪里？

每个组件的 Fiber 节点上有一个 `memoizedState` 链表，每个 Hook 按**调用顺序**挂在上面：

```
Fiber.memoizedState → Hook1 → Hook2 → Hook3 → null
                    (useState) (useEffect) (useRef)
```

**这就是为什么 Hooks 不能在条件语句中使用**：
```jsx
// ❌ 错误：条件改变导致 Hook 顺序变化，链表对应关系错乱
if (condition) {
  const [count, setCount] = useState(0)  // 某次渲染没执行
}
const [name, setName] = useState('')     // 变成了第1个，读到了 count 的值
```

---

### 3.2 useState

```jsx
const [count, setCount] = useState(0)
```

**原理**：
- 初次渲染：创建 Hook 节点，存储初始值
- 调用 `setCount(1)`：创建一个 update 对象，加入更新队列，触发重新渲染
- 重新渲染：从链表读取当前 Hook 节点，计算最新状态值

**批量更新**（React 18）：
```jsx
// React 18 之前：只在合成事件中批量更新
// React 18 之后：所有更新默认批量处理（Automatic Batching）
setCount(c => c + 1)
setName('foo')
// 只触发一次重新渲染，而不是两次
```

---

### 3.3 useEffect

```jsx
useEffect(() => {
  // 副作用逻辑
  return () => { /* 清理 */ }
}, [deps])
```

**执行时机**：
```
渲染 → 提交 DOM → 浏览器绘制 → 执行 useEffect
（异步执行，不��塞浏览器绘制）
```

**依赖对比**：用 `Object.is` 浅比较，依赖变化时重新执行。

**和 useLayoutEffect 的区别**：
```
useEffect      → 异步，浏览器绘制之后执行（大多数场景）
useLayoutEffect → 同步，DOM 更新之后、浏览器绘制之前执行（需要读取 DOM 尺寸时用）
```

---

### 3.4 useRef

```jsx
const ref = useRef(initialValue)
// ref.current 始终指向最新值，修改不触发重新渲染
```

**原理**：Hook 节点的 `memoizedState` 存储 `{ current: value }`，每次渲染返回同一个对象。

**两种用途**：
```jsx
// 1. 访问 DOM 节点
const inputRef = useRef(null)
<input ref={inputRef} />
inputRef.current.focus()

// 2. 保存跨渲染的可变值（不需要触发渲染）
const timerRef = useRef(null)
timerRef.current = setInterval(...)
```

---

### 3.5 useMemo / useCallback

```jsx
const result = useMemo(() => expensiveCalc(a, b), [a, b])
const handler = useCallback(() => doSomething(id), [id])
```

**原理**：缓存上一次的值和依赖，依赖不变时跳过重新计算，直接返回缓存值。

**区别**：
```
useMemo    → 缓存计算结果（值）
useCallback → 缓存函数引用（本质是 useMemo 的语法糖）
```

**什么时候用**：
```
useMemo    → 计算代价高的值 / 传给子组件的对象引用
useCallback → 传给 React.memo 子组件的回调函数
```

---

### 3.6 useContext

```jsx
const value = useContext(MyContext)
```

**原理**：从当前 Fiber 向上遍历，找到最近的 Provider，读取其 value。
Provider value 变化时，所有消费该 Context 的组件**强制重新渲染**（不受 memo 保护）。

---

### 3.7 useReducer

```jsx
const [state, dispatch] = useReducer(reducer, initialState)
```

**原理**与 useState 相同，区别是状态更新逻辑集中在 reducer 函数中。

```
useState  → 适合简单独立的状态
useReducer → 适合状态之间有关联、更新逻辑复杂的场景
```

---

## 四、React 生命周期

### 4.1 Class 组件生命周期

```
挂载阶段
  constructor()
  static getDerivedStateFromProps()
  render()
  componentDidMount()          ← 发请求、订阅事件

更新阶段
  static getDerivedStateFromProps()
  shouldComponentUpdate()      ← 性能优化，返回 false 跳过渲染
  render()
  getSnapshotBeforeUpdate()    ← 获取更新前 DOM 信息（如滚动位置）
  componentDidUpdate()         ← DOM 更新后

卸载阶段
  componentWillUnmount()       ← 清理定时器、取消订阅
```

**已废弃的生命周期**（React 16.3+ 加 UNSAFE_ 前缀）：
```
UNSAFE_componentWillMount
UNSAFE_componentWillReceiveProps
UNSAFE_componentWillUpdate
→ Fiber 的 Render 阶段可中断，这些方法可能被多次调用，有副作用风险
```

### 4.2 函数组件对应关系

```
componentDidMount    ↔  useEffect(() => {}, [])
componentDidUpdate   ↔  useEffect(() => {}, [deps])
componentWillUnmount ↔  useEffect(() => { return () => cleanup() }, [])
shouldComponentUpdate ↔ React.memo + useMemo
```

### 4.3 React 18 严格模式（StrictMode）

开发环境下，React 会**故意执行两次**：
- 组件函数体
- useState 初始化函数
- useEffect 的 setup + cleanup

目的：暴露副作用不纯的问题，为未来的并发特性（如 Offscreen）做准备。

---

## 五、面试高频问题速答

**Q: React.memo、useMemo、useCallback 分别是什么？**

```
React.memo  → HOC，对组件做浅比较，props 不变跳过重新渲染
useMemo     → Hook，缓存计算结果
useCallback → Hook，缓存函数引用
三者都是性能优化手段，不要滥用（本身有维护 deps 的开销）
```

**Q: useEffect 的依赖数组是空数组 [] 和不传有什么区别？**

```
不传          → 每次渲染后都执行
传 []         → 只在挂载时执行一次
传 [a, b]     → a 或 b 变化时执行
```

**Q: 为什么 useState 的更新函数可以传函数？**

```jsx
setCount(prev => prev + 1)
// 用于避免闭包陷阱：回调能拿到最新的 prev 值
// 直接 setCount(count + 1) 在异步环境中可能读到旧的 count
```

**Q: Fiber 的优先级调度是怎么做的？**

```
React 定义了多个优先级（Lane 模型）：
  ImmediatePriority  → 同步，立即执行（如受控输入）
  UserBlockingPriority → 用户交互（点击、hover）
  NormalPriority     → 普通更新（网络请求回调）
  IdlePriority       → 空闲时执行（不重要的后台任务）

高优先级任务可以打断低优先级任务的 Render 阶段
→ 低优先级任务重新从头开始（或从中断点恢复）
```

**Q: key 的作用是什么？**

```
Diff 算法中，key 用于识别列表中同一个元素
key 不变 → 复用旧 Fiber 节点（更新）
key 变化 → 销毁旧节点，创建新节点
不要用 index 作为 key：顺序变化时 index 和内容对不上，导致 bug
```

---

## 六、总结

```
为什么引入 Hooks → 解决 Class 的逻辑复用/分散/this 三大问题
Fiber 架构       → 可中断的工作单元 + 时间切片 + 优先级调度
Hook 底层        → Fiber 节点上的链表，顺序固定不可变
生命周期         → Class 用 componentDidMount 等，函数组件用 useEffect 模拟
```
