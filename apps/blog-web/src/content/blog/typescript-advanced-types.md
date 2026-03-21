# TypeScript 类型体操实战指南

## 前言

TypeScript 的类型系统是图灵完备的，这意味着我们可以用类型做很多事情，从简单的类型检查到复杂的类型计算。

## 基础类型

### 原始类型

```typescript
type StringType = string;
type NumberType = number;
type BooleanType = boolean;
type NullType = null;
type UndefinedType = undefined;
```

### 数组和元组

```typescript
type NumberArray = number[];
type StringTuple = [string, string, string];
type MixedTuple = [string, number, boolean];
```

## 高级类型

### 交叉类型

将多个类型合并为一个类型：

```typescript
interface A { a: string }
interface B { b: number }

type AB = A & B;
// { a: string; b: number }
```

### 联合类型

表示值可以是多种类型之一：

```typescript
type StringOrNumber = string | number;
type CSSUnit = 'px' | 'em' | 'rem' | 'vw' | 'vh';
```

## 工具类型

TypeScript 内置了许多实用的工具类型。

### Partial<T>

将所有属性变为可选：

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; }
```

### Required<T>

将所有属性变为必需：

```typescript
type OptionalUser = Partial<User>;
type FullUser = Required<OptionalUser>;
```

### Pick<T, K>

从类型中选取部分属性：

```typescript
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string; }
```

### Omit<T, K>

从类型中排除部分属性：

```typescript
type UserWithoutEmail = Omit<User, 'email'>;
// { id: number; name: string; }
```

### Exclude<T, U>

从联合类型中排除某些类型：

```typescript
type T0 = Exclude<'a' | 'b' | 'c', 'a'>;  // 'b' | 'c'
type T1 = Exclude<string | number, string>;  // number
```

### Extract<T, U>

选取联合类型中相同的类型：

```typescript
type T0 = Extract<'a' | 'b' | 'c', 'a' | 'f'>;  // 'a'
type T1 = Extract<number | string | boolean, string | boolean>;  // string | boolean
```

## 条件类型

条件类型是根据条件来推断类型：

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<123>;      // false
```

### 分布式条件类型

当条件类型作用于联合类型时，会自动分发：

```typescript
type ToArray<T> = T extends any ? T[] : never;

type StrOrNumArr = ToArray<string | number>;
// 相当于: ToArray<string> | ToArray<number>
// 结果: string[] | number[]
```

## 映射类型

映射类型可以从已有类型创建新类型：

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};

type Stringify<T> = {
  [P in keyof T]: string;
};
```

## 递归类型

TypeScript 支持递归类型定义：

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type NestedObject = {
  user: {
    name: string;
    address: {
      city: string;
      zip: string;
    };
  };
};

type PartialNested = DeepPartial<NestedObject>;
```

## 模板字面量类型

使用模板字符串创建新的字面量类型：

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<'click'>;  // 'onClick'
type ChangeEvent = EventName<'change'>;  // 'onChange'

type CSSProp<T extends string> = `--${T}`;

type CustomProp = CSSProp<'primary-color'>;  // '--primary-color'
```

## infer 关键字

infer 用于在条件类型中推断类型：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = ReturnType<() => string>;  // string
type B = ReturnType<() => Promise<number>>;  // Promise<number>

type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnpackPromise<Promise<string>>;  // string
type B = UnpackPromise<number>;  // number
```

## 实战案例

### 实现一个简易的 FormState 类型

```typescript
type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
};

type LoginForm = FormState<{
  username: string;
  password: string;
}>;
```

### 实现一个类型安全的 event emitter

```typescript
type EventMap = {
  click: { x: number; y: number };
  change: { value: string };
  submit: { data: FormData };
};

class TypedEmitter<T extends Record<string, any>> {
  private listeners: Partial<{ [K in keyof T]: Set<(data: T[K]) => void> }> = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners[event]?.forEach(listener => listener(data));
  }
}

const emitter = new TypedEmitter<EventMap>();
emitter.on('click', (data) => {
  console.log(data.x, data.y);  // 类型安全！
});
```

## 性能考虑

复杂的类型计算会影响编译时间：

1. **避免过度嵌套**：深度嵌套的条件类型会显著增加编译时间
2. **使用缓存**：对于重复计算的类型，可以提取为单独的类型别名
3. **必要时使用 `// eslint-disable-next-line @typescript-eslint/no-explicit-any`**：过度严格的类型约束可能导致类型膨胀

## 总结

TypeScript 的类型系统是一个强大的工具，掌握这些高级类型技巧可以帮助你写出更加类型安全、可维护的代码。
