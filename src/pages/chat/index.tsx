import { useState, useEffect, useRef } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { Button as UIButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SendHorizontal, MessageCircle, User } from 'lucide-react-taro'

interface Message {
  id: number
  user_id: number
  content: string
  is_anonymous: boolean
  created_at: string
  users: { id: number; nickname: string }
}

export default function Chat() {
  const { user } = useUserStore()
  const isLoggedIn = !!user
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [total, setTotal] = useState(0)
  const scrollRef = useRef<any>(null)

  const fetchMessages = async () => {
    try {
      const res = await Network.request({ url: '/api/mvv/messages' })
      console.log('[Chat] fetch messages:', res.data)
      if (res.data?.code === 200) {
        setMessages(res.data.data || [])
        setTotal(res.data.total || 0)
      }
    } catch (err) {
      console.error('[Chat] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    fetchMessages()
  })

  // 自动滚动到底部
  useEffect(() => {
    if (!loading && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo?.(0, 99999)
      }, 100)
    }
  }, [messages, loading])

  const handleSend = async () => {
    if (!content.trim()) return
    if (!isLoggedIn || !user) {
      Taro.showToast({ title: '请先在「智联数通」页设置昵称', icon: 'none' })
      return
    }

    setSending(true)
    try {
      const res = await Network.request({
        url: '/api/mvv/messages',
        method: 'POST',
        data: {
          user_id: user.id,
          content: content.trim(),
          is_anonymous: isAnonymous,
        },
      })
      console.log('[Chat] send message:', res.data)
      if (res.data?.code === 200) {
        setContent('')
        await fetchMessages()
      } else {
        Taro.showToast({ title: res.data?.msg || '发送失败', icon: 'none' })
      }
    } catch (err) {
      console.error('[Chat] send error:', err)
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    } finally {
      setSending(false)
    }
  }

  const handleKeyInput = (e: any) => {
    setContent(e.detail.value)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (!isLoggedIn) {
    return (
      <View className="flex flex-col items-center justify-center h-full px-4">
        <MessageCircle size={64} color="#d0d5dd" />
        <Text className="block text-gray-400 text-base mt-4 text-center">
          需要设置昵称后才能参与讨论
        </Text>
        <Text className="block text-gray-400 text-sm mt-2 text-center">
          请前往「智联数通」页面设置昵称，再回来畅所欲言
        </Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      {/* 顶部信息栏 */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <MessageCircle size={18} color="#1677ff" />
            <Text className="block text-base font-semibold text-gray-800">
              讨论区
            </Text>
          </View>
          <View className="bg-blue-50 rounded-full px-3 py-1">
            <Text className="block text-sm text-blue-600">
              共 {total} 条消息
            </Text>
          </View>
        </View>
        <Text className="block text-xs text-gray-400 mt-1">
          围绕使命愿景价值观自由讨论，每一条想法都值得被听见
        </Text>
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-3"
        scrollY
        scrollWithAnimation
      >
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-gray-400 text-sm">加载中...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <MessageCircle size={48} color="#e5e7eb" />
            <Text className="block text-gray-400 text-sm mt-4">
              还没有人发言，快来第一个发表想法吧
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isSelf = user?.id === msg.user_id
              const displayName = msg.is_anonymous ? '匿名用户' : msg.users?.nickname || '未知用户'
              return (
                <View key={msg.id} className="flex flex-row items-start gap-3">
                  {/* 头像 */}
                  <Avatar className="flex-shrink-0 w-9 h-9">
                    <AvatarFallback className={msg.is_anonymous ? 'bg-gray-200 text-gray-500' : isSelf ? 'bg-blue-500 text-white' : 'bg-indigo-100 text-indigo-600'}>
                      {msg.is_anonymous ? (
                        <User size={16} color="#9ca3af" />
                      ) : (
                        <Text className="block text-xs font-medium">
                          {displayName.charAt(0)}
                        </Text>
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {/* 消息内容 */}
                  <View className="flex-1 min-w-0">
                    <View className="flex flex-row items-center gap-2 mb-1">
                      <Text className="block text-sm font-medium text-gray-700">
                        {displayName}
                      </Text>
                      <Text className="block text-xs text-gray-400">
                        {formatTime(msg.created_at)}
                      </Text>
                      {msg.is_anonymous && (
                        <View className="bg-yellow-50 rounded px-2 py-1">
                          <Text className="block text-xs text-yellow-600">匿名</Text>
                        </View>
                      )}
                    </View>
                    <View
                      className={`inline-block rounded-2xl px-4 py-2 ${
                        isSelf ? 'bg-blue-500' : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`block text-sm leading-relaxed ${
                          isSelf ? 'text-white' : 'text-gray-800'
                        }`}
                      >
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}
            {/* 底部占位，避免被输入栏遮挡 */}
            <View className="h-4" />
          </View>
        )}
      </ScrollView>

      {/* 底部输入栏 - Fixed + flex 用 inline style */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          zIndex: 100,
        }}
      >
        {/* 匿名切换 */}
        <View className="flex flex-row items-center justify-between px-4 pt-2 pb-1">
          <View className="flex flex-row items-center gap-2">
            <Text className="block text-xs text-gray-500">发言模式：</Text>
            <View
              className={`rounded px-2 py-1 ${
                isAnonymous ? 'bg-yellow-50' : 'bg-blue-50'
              }`}
            >
              <Text
                className={`block text-xs ${
                  isAnonymous ? 'text-yellow-600' : 'text-blue-600'
                }`}
              >
                {isAnonymous ? '匿名发言' : '实名发言'}
              </Text>
            </View>
          </View>
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
        </View>
        {/* 输入区域 */}
        <View className="flex flex-row items-center gap-2 px-3 py-2 pb-4">
          <View className="flex-1">
            <Input
              placeholder="说说你的想法..."
              value={content}
              onInput={handleKeyInput}
              confirmType="send"
              onConfirm={handleSend}
              maxlength={500}
              className="rounded-2xl border-0 bg-gray-50 h-auto min-h-10"
            />
          </View>
          <UIButton
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-full"
          >
            <SendHorizontal size={18} color="#fff" />
          </UIButton>
        </View>
      </View>
    </View>
  )
}