import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Network } from '@/network';
import { useUserStore } from '@/stores/user';
import { ThumbsUp, ThumbsDown } from 'lucide-react-taro';

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

const TYPE_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'mission', label: '使命' },
  { key: 'vision', label: '愿景' },
  { key: 'values', label: '价值观' },
] as const;

const TYPE_BADGE: Record<MvvType, { label: string; className: string }> = {
  mission: { label: '使命', className: 'bg-blue-50 text-blue-700' },
  vision: { label: '愿景', className: 'bg-green-50 text-green-700' },
  values: { label: '价值观', className: 'bg-orange-50 text-orange-700' },
};

const BrowsePage: FC = () => {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [userVotes, setUserVotes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = activeTab === 'all' ? {} : { type: activeTab };
      const url = '/api/mvv/submissions';
      const queryStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      const fullUrl = queryStr ? `${url}?${queryStr}` : url;

      const [subRes, voteRes] = await Promise.all([
        Network.request({ url: fullUrl, method: 'GET' }),
        Network.request({ url: `/api/mvv/votes/user/${user.id}`, method: 'GET' }),
      ]);
      console.log('提交列表:', subRes.data);
      console.log('用户投票:', voteRes.data);
      const list = (subRes.data as any)?.data ?? [];
      const votes = (voteRes.data as any)?.data ?? [];
      setSubmissions(list);
      setUserVotes(votes);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  // 投票/取消投票
  const handleVote = async (submissionId: number) => {
    if (!user) {
      Taro.showToast({ title: '请先在"撰写"页设置昵称', icon: 'none' });
      return;
    }
    const isVoted = userVotes.includes(submissionId);
    try {
      if (isVoted) {
        await Network.request({
          url: '/api/mvv/votes',
          method: 'DELETE',
          data: { submission_id: submissionId, user_id: user.id },
        });
        setUserVotes((prev) => prev.filter((id) => id !== submissionId));
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId ? { ...s, vote_count: s.vote_count - 1 } : s,
          ),
        );
      } else {
        await Network.request({
          url: '/api/mvv/votes',
          method: 'POST',
          data: { submission_id: submissionId, user_id: user.id },
        });
        setUserVotes((prev) => [...prev, submissionId]);
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId ? { ...s, vote_count: s.vote_count + 1 } : s,
          ),
        );
      }
    } catch (err: any) {
      const data = err?.data ?? (err as any)?.response?.data;
      if (data?.msg?.includes('已经投过票')) {
        Taro.showToast({ title: '你已经投过票了', icon: 'none' });
      } else {
        Taro.showToast({ title: '操作失败，请重试', icon: 'none' });
      }
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  if (!user) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-gray-50 px-4">
        <Text className="block text-base text-gray-500 text-center">
          请先在&ldquo;撰写&rdquo;页面设置昵称，再浏览提交内容
        </Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* TabBar 类型切换 */}
      <View className="bg-white px-4 pt-3 pb-2">
        <Text className="block text-lg font-semibold text-gray-900 mb-3">浏览 MVV</Text>
        <View className="flex flex-row gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <View
              key={opt.key}
              className={`px-4 py-2 rounded-full border text-sm font-medium ${
                activeTab === opt.key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
              onClick={() => setActiveTab(opt.key)}
            >
              <Text className="block text-sm">{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 提交列表 */}
      <ScrollView className="flex-1 px-4 pt-3 pb-4">
        {loading ? (
          <View className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-full h-24 rounded-xl" />
            ))}
          </View>
        ) : submissions.length === 0 ? (
          <View className="py-12 flex flex-col items-center">
            <Text className="block text-sm text-gray-400">
              {activeTab === 'all' ? '还没有任何提交' : `还没有${TYPE_OPTIONS.find((t) => t.key === activeTab)?.label}相关的提交`}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {submissions.map((item) => {
              const isVoted = userVotes.includes(item.id);
              const badgeInfo = TYPE_BADGE[item.type];
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Badge className={badgeInfo.className}>{badgeInfo.label}</Badge>
                      <Text className="block text-xs text-gray-400">
                        {item.is_anonymous ? '匿名用户' : (item.users?.nickname ?? '未知')}
                      </Text>
                      <Text className="block text-xs text-gray-400">
                        {formatTime(item.created_at)}
                      </Text>
                    </View>
                    <Text className="block text-sm text-gray-700 leading-relaxed mb-3">
                      {item.content}
                    </Text>
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center gap-1">
                        <Text className="block text-xs text-gray-400">
                          {item.vote_count} 票
                        </Text>
                      </View>
                      <Button
                        size="sm"
                        variant={isVoted ? 'default' : 'outline'}
                        onClick={() => handleVote(item.id)}
                      >
                        <View className="flex flex-row items-center gap-1">
                          {isVoted ? (
                            <ThumbsDown size={14} color="white" />
                          ) : (
                            <ThumbsUp size={14} color="#666" />
                          )}
                          <Text className={`block text-xs ${isVoted ? 'text-white' : ''}`}>
                            {isVoted ? '取消' : '赞同'}
                          </Text>
                        </View>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default BrowsePage;