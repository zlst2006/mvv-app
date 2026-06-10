import Taro from '@tarojs/taro';
import { create } from 'zustand';

export interface UserInfo {
  id: number;
  nickname: string;
}

interface UserState {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
}

const storedUser = (() => {
  try {
    const raw = Taro.getStorageSync('mvv_user');
    if (raw) return JSON.parse(raw) as UserInfo;
  } catch {}
  return null;
})();

export const useUserStore = create<UserState>((set) => ({
  user: storedUser,
  setUser: (user) => {
    Taro.setStorageSync('mvv_user', JSON.stringify(user));
    set({ user });
  },
  clearUser: () => {
    Taro.removeStorageSync('mvv_user');
    set({ user: null });
  },
}));