# MVV 共创工具 - 设计风格

## 产品灵魂

> 意象锚点：一面团队共创墙 + 便签纸投票箱

想象一间明亮的会议室，一面巨大的白板墙上贴满了五颜六色的便签纸。团队成员围站在墙前，有的在沉思书写，有的在贴便签，有的在贴纸投票——每一张便签都是一个想法，每一张贴纸都是一份认同。这面墙承载着整个团队对未来的共识。

## 气质与意象

- **关键词**：共创、透明、温暖、专业、协作
- **场景画面**：阳光洒在白色便签墙上，不同颜色的便签代表不同的思考维度——蓝色代表使命（我们要去哪里）、绿色代表愿景（我们想成为谁）、橙色代表价值观（我们相信什么）。团队自由地添加、浏览、投票。
- **情绪**：开放的、包容的、有建设性的

## 视觉策略

- **图像方向**：干净、留白丰富的界面，避免过度的装饰性元素
- **图形语言**：圆角卡片（模拟便签纸）、柔和阴影（模拟立体感）、温和的过渡动效
- **布局**：以内容为中心，信息层级清晰

## 配色方案

| 角色 | Tailwind 类名 | 色值 | 意象来源 |
|------|--------------|------|---------|
| 主色 | `bg-blue-500` / `text-blue-600` | #1890ff / #1677ff | 信任、专业、理性 |
| 使命标签色 | `bg-blue-50` / `text-blue-700` | #e6f4ff / #0958d9 | 蓝色便签 — 方向感 |
| 愿景标签色 | `bg-green-50` / `text-green-700` | #f6ffed / #389e0d | 绿色便签 — 生长感 |
| 价值观标签色 | `bg-orange-50` / `text-orange-700` | #fff7e6 / #d46b08 | 橙色便签 — 温度感 |
| 背景色 | `bg-gray-50` | #fafafa | 白板底色 |
| 卡片底色 | `bg-white` | #ffffff | 便签纸 |
| 文字主色 | `text-gray-900` | #1a1a1a | 清晰可读 |
| 文字辅色 | `text-gray-500` | #8c8c8c | 弱化信息 |
| 分割线 | `border-gray-100` | #f0f0f0 | 轻分割 |

## 字体排版

- **中文字体**：系统默认（PingFang SC / 微软雅黑）
- **英文字体**：系统默认（SF Pro / Segoe UI）
- **层级**：
  - 页面标题：`text-lg font-semibold text-gray-900`
  - 卡片标题：`text-base font-medium text-gray-900`
  - 正文：`text-sm text-gray-700`
  - 辅助文本：`text-xs text-gray-500`
  - 数字/统计：`text-2xl font-bold text-blue-600`

## 间距系统

- 页面边距：`p-4`（16px）
- 卡片内边距：`p-4`（16px）
- 卡片间距：`gap-3` 或 `space-y-3`
- 列表项间距：`gap-3`
- 底部固定栏：`bottom-16`（避开 TabBar）

## 组件使用原则

- 所有通用按钮使用 `@/components/ui/button`
- 卡片使用 `@/components/ui/card`（Card, CardContent, CardHeader）
- Input 输入框使用 `@/components/ui/input`
- Textarea 使用 `@/components/ui/textarea`
- 标签/状态使用 `@/components/ui/badge`
- Tabs 切换使用 `@/components/ui/tabs`
- 弹窗使用 `@/components/ui/dialog`
- Toast 提示使用 `@/components/ui/toast`（已全局注册 Toaster）
- 加载态使用 `@/components/ui/skeleton`
- 图标使用 `lucide-react-taro`

## 导航结构

- **TabBar 三页结构**：
  1. **首页（write）**：撰写/提交 MVV — `pages/index/index`（默认页）
  2. **浏览（browse）**：浏览所有提交并投票 — `pages/browse/index`
  3. **统计（stats）**：查看投票结果 — `pages/stats/index`

- 页面跳转：TabBar 页面用 `switchTab()`，普通页面用 `navigateTo()`

## 设计禁忌

- ❌ 不要用科技蓝 + 圆角卡片的万能组合而无独特意象
- ❌ 不要过度装饰（避免渐变背景、复杂纹理）
- ❌ 不要用 `View/Text` 手搓按钮/Input/弹窗等通用组件
- ❌ 不要在界面中展示真实姓名时不经用户同意
- ❌ 避免拥挤的信息密度，保持每个操作单一清晰