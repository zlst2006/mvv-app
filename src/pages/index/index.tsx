import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Network } from '@/network';
import { useUserStore } from '@/stores/user';
import { Pencil, Eye, EyeOff, Send } from 'lucide-react-taro';

// 类型常量
const TYPE_OPTIONS = [
  { key: 'mission', label: '使命', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'vision', label: '愿景', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'values', label: '价值观', color: 'bg-orange-50 text-orange-700 border-orange-200' },
] as const;

type MvvType = 'mission' | 'vision' | 'values';

interface SubmissionItem {
  id: number;
  type: MvvType;
  content: string;
  is_anonymous: boolean;
  user_id: number;
  users: { id: number; nickname: string };
  vote_count: number;
  created_at: string;
}

const IndexPage: FC = () => {
  const { user, applyUser } = useUserStore();
  const [showRegisterDialog, setShowRegisterDialog] = useState(!user);
  const [realName, setRealName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [applied, setApplied] = useState(false);

  // 提交表单
  const [selectedType, setSelectedType] = useState<MvvType>('mission');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 最近提交
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 数据概览
  const [overview, setOverview] = useState<{
    total_users: number;
    total_submissions: number;
    total_votes: number;
  } | null>(null);

  // 判断用户状态
  const isPending = user?.status === 'pending';

  // 加载最近提交 + 概览
  const loadRecent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subRes, statsRes] = await Promise.all([
        Network.request({ url: '/api/mvv/submissions', method: 'GET' }),
        Network.request({ url: '/api/mvv/stats', method: 'GET' }),
      ]);
      console.log('最近提交数据:', subRes.data);
      console.log('概览数据:', statsRes.data);
      const list = (subRes.data as any)?.data ?? [];
      setRecentSubmissions(list.slice(0, 10));
      const stats = (statsRes.data as any)?.data;
      if (stats?.overview) {
        setOverview(stats.overview);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setShowRegisterDialog(false);
      loadRecent();
    }
  }, [user]);

  // 注册申请
  const handleApply = async () => {
    if (!realName.trim()) {
      Taro.showToast({ title: '请输入真实姓名', icon: 'none' });
      return;
    }
    if (realName.trim().length > 50) {
      Taro.showToast({ title: '姓名不能超过50个字符', icon: 'none' });
      return;
    }
    setRegistering(true);
    try {
      await applyUser(realName.trim());
      setApplied(true);
      Taro.showToast({ title: '申请已提交，等待管理员审核', icon: 'success' });
    } catch (err: any) {
      console.error('注册申请失败:', err);
      Taro.showToast({ title: err.message || '申请失败', icon: 'none' });
    } finally {
      setRegistering(false);
    }
  };

  // 管理员登录
  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      Taro.showToast({ title: '请输入管理员密码', icon: 'none' });
      return;
    }
    setRegistering(true);
    try {
      const res = await Network.request({
        url: '/api/mvv/users/admin-login-simple',
        method: 'POST',
        data: { password: adminPassword.trim() },
      });
      const adminUser = (res.data as any).data;
      useUserStore.getState().setUser(adminUser);
      Taro.showToast({ title: '管理员登录成功！', icon: 'success' });
      setShowRegisterDialog(false);
    } catch (err: any) {
      console.error('管理员登录失败:', err);
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      setRegistering(false);
    }
  };

  // 提交MVV
  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    if (!user) {
      Taro.showToast({ title: '请先注册', icon: 'none' });
      return;
    }
    if (isPending) {
      Taro.showToast({ title: '您的账号正在审核中，请耐心等待', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await Network.request({
        url: '/api/mvv/submissions',
        method: 'POST',
        data: {
          user_id: user.id,
          type: selectedType,
          content: content.trim(),
          is_anonymous: isAnonymous,
        },
      });
      console.log('提交结果:', res.data);
      Taro.showToast({ title: '提交成功！', icon: 'success' });
      setContent('');
      loadRecent();
    } catch (err) {
      console.error('提交失败:', err);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  // 切换用户
  const handleSwitchUser = () => {
    setShowRegisterDialog(true);
    setRealName('');
    setAdminPassword('');
    setIsAdminMode(false);
    setApplied(false);
  };

  const getTypeBadge = (type: MvvType) => {
    const opt = TYPE_OPTIONS.find((t) => t.key === type);
    return opt?.label ?? type;
  };

  const getTypeColor = (type: MvvType) => {
    const opt = TYPE_OPTIONS.find((t) => t.key === type);
    return opt?.color ?? 'bg-gray-50 text-gray-700';
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 注册/登录弹窗 */}
      <Dialog
        open={showRegisterDialog}
        onOpenChange={(open) => {
          if (!open && user) setShowRegisterDialog(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>智联数通 · 使命愿景共创</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            {applied ? (
              <View className="text-center py-6">
                <Text className="block text-3xl mb-3">📋</Text>
                <Text className="block text-base font-medium text-gray-900 mb-2">申请已提交</Text>
                <Text className="block text-sm text-gray-500">
                  等待管理员审核通过后即可参与共创{'\n'}请留意页面提示
                </Text>
              </View>
            ) : (
              <>
                {!isAdminMode && (
                  <>
                    <Text className="block text-sm text-gray-500 mb-1">真实姓名</Text>
                    <View className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                      <Input
                        placeholder="请输入你的真实姓名（用于审核）"
                        value={realName}
                        onInput={(e) => setRealName(e.detail.value)}
                        className="w-full bg-transparent"
                      />
                    </View>
                  </>
                )}
                {isAdminMode && (
                  <>
                    <Text className="block text-sm text-gray-500 mb-1">管理员密码</Text>
                    <View className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                      <Input
                        placeholder="输入管理员密码"
                        value={adminPassword}
                        onInput={(e) => setAdminPassword(e.detail.value)}
                        className="w-full bg-transparent"
                      />
                    </View>
                  </>
                )}
                {isAdminMode ? (
                  <View className="flex flex-row gap-3 mt-2">
                    <Button
                      className="flex-1"
                      disabled={registering || !adminPassword.trim()}
                      onClick={handleAdminLogin}
                    >
                      <Text>{registering ? '登录中...' : '管理员登录'}</Text>
                    </Button>
                  </View>
                ) : (
                  <View className="flex flex-row gap-3 mt-2">
                    <Button
                      className="flex-1"
                      disabled={registering || !realName.trim()}
                      onClick={handleApply}
                    >
                      <Text>{registering ? '提交中...' : '申请加入'}</Text>
                    </Button>
                  </View>
                )}
                <View className="mt-4 pt-3 border-t border-gray-100">
                  <View
                    className="flex flex-row items-center justify-center"
                    onClick={() => { setIsAdminMode(!isAdminMode); setAdminPassword(''); }}
                  >
                    <Text className="block text-xs text-blue-500">
                      {isAdminMode ? '← 普通成员申请加入' : '管理员登录 →'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </DialogContent>
      </Dialog>

      {/* 页面标题和统计概览 */}
      <View className="bg-white px-4 pt-4 pb-3"
        style={{
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <View className="flex flex-row items-center justify-between mb-3">
          <View>
            <Text className="block text-lg font-semibold text-gray-900">智联数通使命愿景共创</Text>
            <Text className="block text-xs text-gray-500 mt-1">
              写下你对公司使命、愿景、价值观的想法
            </Text>
          </View>
          {user && (
            <View
              className="flex flex-row items-center gap-1 bg-gray-100 rounded-full px-3 py-2"
              onClick={handleSwitchUser}
            >
              <Pencil size={14} color="#666" />
              <Text className="block text-sm text-gray-600">{user.nickname}</Text>
            </View>
          )}
        </View>

        {/* 数据概览 */}
        {overview && (
          <View className="flex flex-row bg-blue-50 rounded-xl px-3 py-3 gap-3">
            <View className="flex-1 items-center">
              <Text className="block text-lg font-bold text-blue-600">{overview.total_users}</Text>
              <Text className="block text-xs text-blue-400">参与人数</Text>
            </View>
            <View className="w-px bg-blue-100" />
            <View className="flex-1 items-center">
              <Text className="block text-lg font-bold text-blue-600">{overview.total_submissions}</Text>
              <Text className="block text-xs text-blue-400">提交条数</Text>
            </View>
            <View className="w-px bg-blue-100" />
            <View className="flex-1 items-center">
              <Text className="block text-lg font-bold text-blue-600">{overview.total_votes}</Text>
              <Text className="block text-xs text-blue-400">总投票数</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-4 pb-4">
        {/* 提交表单卡片 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* 类型选择 */}
            <Text className="block text-sm font-medium text-gray-700 mb-2">选择类型</Text>
            <View className="flex flex-row gap-2 mb-4">
              {TYPE_OPTIONS.map((opt) => (
                <View
                  key={opt.key}
                  className={`px-4 py-2 rounded-full border text-sm font-medium ${
                    selectedType === opt.key
                      ? `${opt.color} border-current`
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                  onClick={() => setSelectedType(opt.key)}
                >
                  <Text className="block text-sm">{opt.label}</Text>
                </View>
              ))}
            </View>

            {/* 内容输入 */}
            <Text className="block text-sm font-medium text-gray-700 mb-2">你的想法</Text>
            <Textarea
              className="min-h-[100px] mb-4"
              placeholder={`请描述你对公司${TYPE_OPTIONS.find((t) => t.key === selectedType)?.label}的理解...`}
              value={content}
              onInput={(e) => setContent(e.detail.value)}
              maxlength={500}
            />

            {/* 模式选择 */}
            <View className="flex flex-row items-center justify-between mb-4">
              <View className="flex flex-row items-center gap-2">
                {isAnonymous ? (
                  <EyeOff size={18} color="#999" />
                ) : (
                  <Eye size={18} color="#1677ff" />
                )}
                <Text className="block text-sm text-gray-600">
                  {isAnonymous ? '匿名提交' : '实名提交'}
                </Text>
              </View>
              <Switch checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(v)} />
            </View>

            {/* 提交按钮 */}
            <Button
              className="w-full"
              disabled={submitting || !content.trim()}
              onClick={handleSubmit}
            >
              <View className="flex flex-row items-center gap-2">
                <Send size={16} color="white" />
                <Text className="block text-white">
                  {submitting ? '提交中...' : '提交想法'}
                </Text>
              </View>
            </Button>
          </CardContent>
        </Card>

        {/* 最近提交 */}
        <View className="mb-2">
          <Text className="block text-sm font-medium text-gray-700 mb-3">最新提交</Text>
          {loading ? (
            <View className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-20 rounded-xl" />
              ))}
            </View>
          ) : recentSubmissions.length === 0 ? (
            <View className="py-8 flex flex-col items-center">
              <Text className="block text-sm text-gray-400">还没有提交，快来写下第一个想法吧！</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {recentSubmissions.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeBadge(item.type)}
                      </Badge>
                      <Text className="block text-xs text-gray-400">
                        {item.is_anonymous ? '匿名' : item.users?.nickname ?? '未知'}
                      </Text>
                      <Text className="block text-xs text-gray-400">
                        {formatTime(item.created_at)}
                      </Text>
                    </View>
                    <Text className="block text-sm text-gray-700 leading-relaxed">
                      {item.content}
                    </Text>
                    <View className="flex flex-row items-center gap-1 mt-2">
                      <Text className="block text-xs text-gray-400">
                        {item.vote_count} 票
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default IndexPage;