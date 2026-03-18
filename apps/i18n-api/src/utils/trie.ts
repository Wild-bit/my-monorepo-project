/**
 *  @description 前缀树 用于验证key是否合法
 * 主要三种冲突场景
 *  1. 父子冲突（叶子节点同时作为父节点）
 * ```
 * "user.name"       → { user: { name: "xxx" } }
 * "user.name.first" → { user: { name: { first: "xxx" } } }  ← 冲突！name 不能同时是字符串和对象
 * ```
 *  2. 子父冲突（父节点已有子节点时不能变为叶子）
 * ```
 * "user.name.first" → { user: { name: { first: "xxx" } } }  ← 冲突！name 不能同时是字符串和对象
 * "user.name"       → { user: { name: "xxx" } } 与上面方向相反 — 先插入 `user.name.first`，再插入 `user.name` 时触发。
 * ```
 *  3. 重复 key
 * ```
 * "user.name"       → { user: { name: "xxx" } }
 * "user.name"       → { user: { name: "xxx" } }  ← 冲突！name 不能重复
 * ```
 * */

import { ConflictException } from '@nestjs/common';

export default class Trie {
  children: Map<string, Trie>;
  isLeaf: boolean;

  constructor() {
    this.children = new Map();
    this.isLeaf = false;
  }

  validateKey(keys: string[]) {
    const root = new Trie();
    for (const key of keys) {
      const parts = key.split('.');
      let node = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i] as string;
        const isLast = i === parts.length - 1;
        if (!node.children.has(part)) {
          node.children.set(part, new Trie());
        }
        node = node.children.get(part)!;
        if (node.isLeaf && !isLast) {
          throw new ConflictException('Key名称 冲突');
        }
        if (isLast) {
          if (node.children.size > 0) {
            throw new ConflictException('Key名称 冲突');
          }
          if (node.isLeaf) {
            throw new ConflictException(`重复 key: "${key}"`);
          }
          node.isLeaf = true;
        }
      }
    }
  }
}
