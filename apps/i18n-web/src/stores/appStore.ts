/**
 * 全局应用状态
 * 仅用于真正需要全局共享的状态
 */

import { create } from 'zustand';

interface AppState {
  // 用户信息
  user: {
    id: string;
    name: string;
    email: string;
  } | null;

  // 全局 loading 状态
  isLoading: boolean;

  // Actions
  setUser: (user: AppState['user']) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
