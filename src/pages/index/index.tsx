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
  const { user, setUser } = useUserStore();
  const [showNicknameDialog, setShowNicknameDialog] = useState(!user);
  const [nickname, setNickname] = useState('');
  const [creating, setCreating] = useState(false);

  // 提交表单
  const [selectedType, setSelectedType] = useState<MvvType>('mission');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 最近提交
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载最近提交
  const loadRecent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await Network.request({ url: '/api/mvv/submissions', method: 'GET' });
      console.log('最近提交数据:', res.data);
      const list = (res.data as any)?.data ?? [];
      setRecentSubmissions(list.slice(0, 10));
    } catch (err) {
      console.error('加载提交列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecent();
    }
  }, [user]);

  // 创建用户
  const handleCreateUser = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (nickname.trim().length > 50) {
      Taro.showToast({ title: '昵称不能超过50个字符', icon: 'none' });
      return;
    }
    setCreating(true);
    try {
      const res = await Network.request({
        url: '/api/mvv/users',
        method: 'POST',
        data: { nickname: nickname.trim() },
      });
      console.log('创建用户结果:', res.data);
      const userData = (res.data as any)?.data;
      if (userData) {
        setUser({ id: userData.id, nickname: userData.nickname });
        setShowNicknameDialog(false);
        Taro.showToast({ title: '欢迎加入！', icon: 'success' });
      }
    } catch (err) {
      console.error('创建用户失败:', err);
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' });
    } finally {
      setCreating(false);
    }
  };

  // 提交MVV
  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    if (!user) {
      Taro.showToast({ title: '请先设置昵称', icon: 'none' });
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
    setShowNicknameDialog(true);
    setNickname('');
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
      {/* 昵称设置弹窗 */}
      <Dialog
        open={showNicknameDialog}
        onOpenChange={(open) => {
          if (!open && user) setShowNicknameDialog(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>👋 欢迎加入 MVV 共创</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <Text className="block text-sm text-gray-500 mb-3">
              请设置你的昵称，方便团队成员了解谁写了什么
            </Text>
            <Input
              className="w-full"
              placeholder="输入你的昵称..."
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
            />
          </View>
          <View className="flex flex-row gap-3">
            <Button
              className="flex-1"
              disabled={creating || !nickname.trim()}
              onClick={handleCreateUser}
            >
              <Text>{creating ? '创建中...' : '进入共创'}</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 页面标题和用户信息 */}
      <View className="bg-white px-4 pt-4 pb-2">
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="block text-lg font-semibold text-gray-900">撰写 MVV</Text>
            <Text className="block text-xs text-gray-500 mt-1">
              写下你对公司使命、愿景、价值观的想法
            </Text>
          </View>
          {user && (
            <View
              className="flex flex-row items-center gap-1 bg-gray-100 rounded-full px-3 py-1"
              onClick={handleSwitchUser}
            >
              <Pencil size={14} color="#666" />
              <Text className="block text-sm text-gray-600">{user.nickname}</Text>
            </View>
          )}
        </View>
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