import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface UserStats {
  id: number
  nickname: string
  total_submissions: number
  total_votes_received: number
  submissions: {
    mission: any[]
    vision: any[]
    values: any[]
  }
}

interface StatsData {
  mission: any[]
  vision: any[]
  values: any[]
  users: UserStats[]
  overview: {
    total_users: number
    total_submissions: number
    total_votes: number
  }
}

// 饼状图配色方案
const PIE_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
  '#722ed1', '#13c2c2', '#faad14', '#f5222d',
  '#2f54eb', '#a0d911',
]

/** 生成 CSS conic-gradient 饼图背景 */
function buildPieGradient(users: UserStats[], totalVotes: number): string {
  if (totalVotes === 0) return 'conic-gradient(#f0f0f0 0deg 360deg)'
  let currentDeg = 0
  const stops: string[] = []
  users.forEach((u, i) => {
    if (u.total_votes_received === 0) return
    const ratio = u.total_votes_received / totalVotes
    const deg = Math.round(ratio * 360)
    const color = PIE_COLORS[i % PIE_COLORS.length]
    const start = currentDeg
    const end = currentDeg + deg
    stops.push(`${color} ${start}deg ${end}deg`)
    currentDeg = end
  })
  if (stops.length === 0) return 'conic-gradient(#f0f0f0 0deg 360deg)'
  return `conic-gradient(${stops.join(', ')})`
}

function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await Network.request({ url: '/api/mvv/stats' })
      console.log('[Stats] response:', res.data)
      setStats(res.data?.data ?? null)
    } catch (e) {
      console.error('[Stats] load error:', e)
      Taro.showToast({ title: '加载数据失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="p-4 space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </View>
    )
  }

  if (!stats) {
    return (
      <View className="flex items-center justify-center h-full p-4">
        <Text className="block text-gray-400 text-base text-center">
          暂无统计数据
        </Text>
      </View>
    )
  }

  const { overview, users, mission, vision, values } = stats
  const pieGradient = buildPieGradient(users, overview.total_votes)

  // 当前 tab 的提交数据
  const currentItems = activeTab === 'all'
    ? [...mission, ...vision, ...values]
    : stats[activeTab as keyof StatsData] as any[] ?? []

  const typeLabels: Record<string, string> = {
    all: '全部',
    mission: '使命',
    vision: '愿景',
    values: '价值观',
  }

  return (
    <ScrollView className="h-full bg-gray-50">
      <View className="px-4 pt-4 pb-6 space-y-4">
        {/* ===== 总览卡片 ===== */}
        <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5">
          <Text className="block text-white text-sm mb-3" style={{ opacity: 0.8 }}>数据总览</Text>
          <View className="flex flex-row justify-around">
            <View className="items-center">
              <Text className="block text-white text-2xl font-bold">{overview.total_users}</Text>
              <Text className="block text-white text-xs mt-1" style={{ opacity: 0.7 }}>参与人数</Text>
            </View>
            <View className="w-px bg-white" style={{ opacity: 0.2 }} />
            <View className="items-center">
              <Text className="block text-white text-2xl font-bold">{overview.total_submissions}</Text>
              <Text className="block text-white text-xs mt-1" style={{ opacity: 0.7 }}>提交条数</Text>
            </View>
            <View className="w-px bg-white" style={{ opacity: 0.2 }} />
            <View className="items-center">
              <Text className="block text-white text-2xl font-bold">{overview.total_votes}</Text>
              <Text className="block text-white text-xs mt-1" style={{ opacity: 0.7 }}>总投票数</Text>
            </View>
          </View>
        </View>

        {/* ===== 饼状图区域 ===== */}
        {users.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <Text className="block text-base font-semibold mb-3">得票分布</Text>
              <View className="flex flex-row items-center justify-center gap-6">
                {/* 饼图 */}
                <View
                  className="w-32 h-32 rounded-full flex-shrink-0"
                  style={{
                    background: pieGradient,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                {/* 图例 */}
                <View className="flex-1 space-y-2">
                  {users.filter(u => u.total_votes_received > 0).map((u, i) => (
                    <View key={u.id} className="flex flex-row items-center gap-2">
                      <View
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <Text className="block text-sm text-gray-600 flex-1 truncate">
                        {u.nickname}
                      </Text>
                      <Text className="block text-sm font-semibold text-gray-800">
                        {u.total_votes_received}票
                      </Text>
                    </View>
                  ))}
                  {users.filter(u => u.total_votes_received > 0).length === 0 && (
                    <Text className="block text-sm text-gray-400">暂无得票数据</Text>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* ===== 人员排名 ===== */}
        <Card>
          <CardContent className="p-4">
            <Text className="block text-base font-semibold mb-3">🏆 人员贡献榜</Text>
            {users.length === 0 ? (
              <Text className="block text-sm text-gray-400 text-center py-4">暂无数据</Text>
            ) : (
              <View className="space-y-3">
                {users.map((u, index) => {
                  const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
                  return (
                    <View key={u.id} className="flex flex-row items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <Text className="block text-base w-7 text-center">{rankEmoji}</Text>
                      <View className="flex-1">
                        <Text className="block font-medium text-sm text-gray-800">{u.nickname}</Text>
                        <View className="flex flex-row gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {u.total_submissions}条提交
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {u.total_votes_received}票获得
                          </Badge>
                        </View>
                      </View>
                      {/* 进度条 */}
                      <View className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${overview.total_votes > 0 ? Math.round((u.total_votes_received / overview.total_votes) * 100) : 0}%`,
                          }}
                        />
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </CardContent>
        </Card>

        {/* ===== 提交排名（按类型切换） ===== */}
        <Card>
          <CardContent className="p-4">
            <Text className="block text-base font-semibold mb-3">内容排行</Text>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-3">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab}>
                {currentItems.length === 0 ? (
                  <Text className="block text-sm text-gray-400 text-center py-4">
                    暂无内容
                  </Text>
                ) : (
                  <View className="space-y-2">
                    {currentItems.slice(0, 20).map((item: any, idx: number) => {
                      const author = item.is_anonymous
                        ? '匿名用户'
                        : item.users?.nickname ?? '未知'
                      return (
                        <View key={item.id} className="flex flex-row items-start gap-2 bg-gray-50 rounded-xl p-3">
                          <Text className="block text-sm font-bold text-gray-400 w-6 text-center mt-1">
                            {idx + 1}
                          </Text>
                          <View className="flex-1 min-w-0">
                            <View className="flex flex-row items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.type === 'mission' ? '使命' : item.type === 'vision' ? '愿景' : '价值观'}
                              </Badge>
                              <Text className="block text-xs text-gray-400">{author}</Text>
                            </View>
                            <Text className="block text-sm text-gray-700 leading-relaxed">
                              {item.content}
                            </Text>
                            <View className="flex flex-row items-center gap-1 mt-1">
                              <Text className="block text-xs text-orange-500 font-semibold">
                                {item.vote_count}票
                              </Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  )
}

export default StatsPage