import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Network } from '@/network';
import { Trophy, Medal, Award } from 'lucide-react-taro';

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

interface StatsData {
  mission: SubmissionItem[];
  vision: SubmissionItem[];
  values: SubmissionItem[];
}

const TYPE_CONFIG = [
  { key: 'mission' as MvvType, label: '使命 Mission', icon: '🎯', color: 'border-l-blue-500' },
  { key: 'vision' as MvvType, label: '愿景 Vision', icon: '🌟', color: 'border-l-green-500' },
  { key: 'values' as MvvType, label: '价值观 Values', icon: '💎', color: 'border-l-orange-500' },
];

const RANK_ICONS = [
  <Trophy key="1" size={20} color="#f59e0b" />,
  <Medal key="2" size={18} color="#9ca3af" />,
  <Award key="3" size={16} color="#d97706" />,
];

const StatsPage: FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await Network.request({ url: '/api/mvv/stats', method: 'GET' });
      console.log('统计数据:', res.data);
      const data = (res.data as any)?.data;
      setStats(data);

      // 计算总票数
      let votes = 0;
      if (data) {
        for (const type of ['mission', 'vision', 'values'] as const) {
          for (const item of data[type] ?? []) {
            votes += item.vote_count;
          }
        }
      }
      setTotalVotes(votes);
    } catch (err) {
      console.error('加载统计失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (item: SubmissionItem) => {
    if (item.is_anonymous) return '匿名用户';
    return item.users?.nickname ?? '未知';
  };

  if (loading) {
    return (
      <View className="flex flex-col h-full bg-gray-50 p-4">
        <Skeleton className="w-32 h-6 mb-4" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-48 mb-3 rounded-xl" />
        ))}
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-gray-50 px-4">
        <Text className="block text-base text-gray-500 text-center">
          暂无统计数据，快去提交和投票吧！
        </Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-3">
        <Text className="block text-lg font-semibold text-gray-900">投票统计</Text>
        <Text className="block text-xs text-gray-500 mt-1">
          共 {totalVotes} 票 · 投票选出我们共同的 MVV
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-3 pb-4">
        <View className="space-y-4">
          {TYPE_CONFIG.map((cfg) => {
            const items = stats[cfg.key] ?? [];
            return (
              <Card key={cfg.key}>
                <CardContent className="p-4">
                  <View className="flex flex-row items-center gap-2 mb-3">
                    <Text className="block text-base">{cfg.icon}</Text>
                    <Text className="block text-base font-semibold text-gray-900">
                      {cfg.label}
                    </Text>
                    <Badge className="bg-gray-100 text-gray-600">
                      {items.length} 条 · {items.reduce((sum, i) => sum + i.vote_count, 0)} 票
                    </Badge>
                  </View>

                  {items.length === 0 ? (
                    <Text className="block text-sm text-gray-400 py-4 text-center">
                      暂无提交
                    </Text>
                  ) : (
                    <View className="space-y-3">
                      {items.map((item, idx) => (
                        <View
                          key={item.id}
                          className={`border-l-4 ${cfg.color} pl-3 py-2 ${idx === 0 ? 'bg-yellow-50 -mx-3 px-3 rounded-lg' : ''}`}
                        >
                          <View className="flex flex-row items-center gap-2 mb-1">
                            {idx < 3 && RANK_ICONS[idx]}
                            <Text className="block text-xl font-bold text-blue-600">
                              {item.vote_count}
                            </Text>
                            <Text className="block text-xs text-gray-400">票</Text>
                          </View>
                          <Text className="block text-sm text-gray-700 leading-relaxed mb-1">
                            {item.content}
                          </Text>
                          <Text className="block text-xs text-gray-400">
                            — {getDisplayName(item)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default StatsPage;