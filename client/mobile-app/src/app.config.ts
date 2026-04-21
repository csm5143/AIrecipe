import { defineAppConfig } from 'taro';

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/user/index',
  ],
  subPackages: [],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AIRecipe',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#409eff',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/user/index', text: '我的' },
    ],
  },
});
