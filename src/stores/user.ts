import Taro from '@tarojs/taro';
import { create } from 'zustand';
import { Network } from '@/network';

export interface UserInfo {
  id: number;
  nickname: string;
  real_name?: string;
  status?: string;
  is_admin?: boolean;
}

interface UserState {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  // 注册申请
  applyUser: (realName: string) => Promise<UserInfo>;
  // 管理员登录
  adminLogin: (userId: number, password: string) => Promise<UserInfo>;
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
  applyUser: async (realName: string) => {
    const res = await Network.request({
      url: '/api/mvv/users/apply',
      method: 'POST',
      data: { real_name: realName },
    });
    const user = (res.data as any).data as UserInfo;
    Taro.setStorageSync('mvv_user', JSON.stringify(user));
    set({ user });
    return user;
  },
  adminLogin: async (userId: number, password: string) => {
    const res = await Network.request({
      url: '/api/mvv/users/admin-login',
      method: 'POST',
      data: { user_id: userId, password },
    });
    const user = (res.data as any).data as UserInfo;
    Taro.setStorageSync('mvv_user', JSON.stringify(user));
    set({ user });
    return user;
  },
}));