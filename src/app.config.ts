export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/browse/index',
    'pages/stats/index',
    'pages/chat/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '智联数通',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '撰写',
        iconPath: './assets/tabbar/edit.png',
        selectedIconPath: './assets/tabbar/edit-active.png',
      },
      {
        pagePath: 'pages/browse/index',
        text: '浏览',
        iconPath: './assets/tabbar/eye.png',
        selectedIconPath: './assets/tabbar/eye-active.png',
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计',
        iconPath: './assets/tabbar/chart-bar-stacked.png',
        selectedIconPath: './assets/tabbar/chart-bar-stacked-active.png',
      },
      {
        pagePath: 'pages/chat/index',
        text: '讨论',
        iconPath: './assets/tabbar/message-circle.png',
        selectedIconPath: './assets/tabbar/message-circle-active.png',
      },
    ],
  },
})
