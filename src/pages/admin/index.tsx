import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, ScrollView } from '@tarojs/components';
import { Network } from '@/network';
import { useUserStore } from '@/stores/user';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Check, X, Settings2, MessageCircle } from 'lucide-react-taro';

interface PendingUser {
  id: number;
  nickname: string;
  real_name: string;
  status: string;
  applied_at: string;
}

interface ApprovedUser {
  id: number;
  nickname: string;
  real_name: string;
  status: string;
  is_admin: boolean;
  created_at: string;
}

export default function Index() {
  const { user } = useUserStore();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('pending');

  const isAdmin = user?.is_admin === true;

  // 加载待审核用户
  const loadPendingUsers = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/mvv/users/pending' });
      setPendingUsers((res.data as any).data ?? []);
    } catch (e) {
      console.error('加载待审核用户失败', e);
    }
  }, []);

  // 加载已批准用户
  const loadApprovedUsers = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/mvv/users' });
      setApprovedUsers((res.data as any).data ?? []);
    } catch (e) {
      console.error('加载用户列表失败', e);
    }
  }, []);

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/mvv/settings' });
      setSettings((res.data as any).data ?? {});
    } catch (e) {
      console.error('加载设置失败', e);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
    loadApprovedUsers();
    loadSettings();
  }, [loadPendingUsers, loadApprovedUsers, loadSettings]);

  // 审批用户
  const handleApprove = async (userId: number) => {
    if (!user) return;
    try {
      await Network.request({
        url: `/api/mvv/users/${userId}/approve`,
        method: 'POST',
        data: { approved_by: user.id },
      });
      Taro.showToast({ title: '已通过', icon: 'success' });
      loadPendingUsers();
      loadApprovedUsers();
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  };

  // 拒绝用户
  const handleReject = async (userId: number) => {
    try {
      await Network.request({
        url: `/api/mvv/users/${userId}/reject`,
        method: 'POST',
      });
      Taro.showToast({ title: '已拒绝', icon: 'success' });
      loadPendingUsers();
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  };

  // 更新设置
  const handleToggleSetting = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      await Network.request({
        url: '/api/mvv/settings',
        method: 'POST',
        data: { key, value: String(value), updated_by: user.id },
      });
      setSettings((prev) => ({ ...prev, [key]: String(value) }));
      Taro.showToast({ title: value ? '已开启' : '已关闭', icon: 'success' });
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' });
    }
  };

  if (!isAdmin) {
    return (
      <View className="flex flex-col items-center justify-center h-full p-8">
        <Settings2 size={64} color="#d1d5db" />
        <Text className="block text-gray-400 text-lg mt-4">仅管理员可访问</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 顶部导航 */}
      <View className="px-4 pt-3 pb-2 bg-white">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v || 'pending')}>
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              <Text className="block text-sm">待审核</Text>
              {pendingUsers.length > 0 && (
                <Badge className="ml-1">{pendingUsers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">
              <Text className="block text-sm">已通过</Text>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Text className="block text-sm">系统设置</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      <ScrollView className="flex-1 px-4 pt-3" scrollY>
        {/* 待审核 */}
        {activeTab === 'pending' && (
          <View>
            {pendingUsers.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-20">
                <Check size={48} color="#22c55e" />
                <Text className="block text-gray-400 mt-3">暂无待审核用户</Text>
              </View>
            ) : (
              pendingUsers.map((u) => (
                <Card key={u.id} className="mb-3 p-4">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="block text-base font-semibold text-gray-900">{u.real_name}</Text>
                      <Text className="block text-xs text-gray-400 mt-1">
                        申请时间：{u.applied_at ? new Date(u.applied_at).toLocaleString('zh-CN') : '-'}
                      </Text>
                    </View>
                    <View className="flex flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(u.id)}
                        className="border-red-200 text-red-500"
                      >
                        <X size={14} color="#ef4444" />
                        <Text className="block text-xs ml-1">拒绝</Text>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(u.id)}
                      >
                        <Check size={14} color="#fff" />
                        <Text className="block text-xs ml-1">通过</Text>
                      </Button>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* 已通过 */}
        {activeTab === 'approved' && (
          <View>
            {approvedUsers.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-20">
                <Text className="block text-gray-400">暂无已通过用户</Text>
              </View>
            ) : (
              approvedUsers.map((u) => (
                <Card key={u.id} className="mb-2 p-3">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-3">
                      <View className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <Text className="block text-white text-sm font-bold">{u.real_name?.[0] || '?'}</Text>
                      </View>
                      <View>
                        <View className="flex flex-row items-center gap-2">
                          <Text className="block text-sm font-semibold text-gray-900">{u.real_name}</Text>
                          {u.is_admin && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">管理员</Badge>
                          )}
                        </View>
                        <Text className="block text-xs text-gray-400 mt-1">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('zh-CN') : '-'} 加入
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* 系统设置 */}
        {activeTab === 'settings' && (
          <View>
            {/* 讨论区管控 */}
            <Card className="mb-3 p-4">
              <View className="flex flex-row items-center gap-2 mb-4">
                <MessageCircle size={20} color="#6366f1" />
                <Text className="block text-base font-bold text-gray-900">讨论区管控</Text>
              </View>

              <View className="flex flex-row items-center justify-between py-3 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-gray-900">强制关闭匿名发言</Text>
                  <Text className="block text-xs text-gray-400 mt-1">
                    开启后，讨论区所有人必须使用实名发言
                  </Text>
                </View>
                <Switch
                  checked={settings['force_disable_anonymous'] === 'true'}
                  onCheckedChange={(v) => handleToggleSetting('force_disable_anonymous', v)}
                />
              </View>

              <View className="flex flex-row items-center justify-between py-3">
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-gray-900">强制关闭实名发言</Text>
                  <Text className="block text-xs text-gray-400 mt-1">
                    开启后，讨论区所有人必须使用匿名发言
                  </Text>
                </View>
                <Switch
                  checked={settings['force_disable_realname'] === 'true'}
                  onCheckedChange={(v) => handleToggleSetting('force_disable_realname', v)}
                />
              </View>
            </Card>

            {/* 管理员密码提示 */}
            <Card className="p-4">
              <View className="flex flex-row items-center gap-2 mb-2">
                <Settings2 size={18} color="#6b7280" />
                <Text className="block text-sm font-medium text-gray-700">管理员密码</Text>
              </View>
              <Text className="block text-xs text-gray-400">
                当前管理员密码：「admin888」
                {'\n'}普通用户在首页点击「我是管理员」输入密码即可成为管理员
              </Text>
            </Card>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}