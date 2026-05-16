// 微信自定义 tabBar：目录名必须为 custom-tab-bar，且放在 miniprogram 根目录
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页' },
      { pagePath: '/pages/custom/index', text: '定制' },
      { pagePath: '/pages/collections/index', text: '收藏' },
      { pagePath: '/pages/mine/index', text: '我的' }
    ]
  },

  methods: {
    switchTab(e) {
      const dataset = e.currentTarget.dataset;
      const path = dataset.path;
      const index = dataset.index;
      if (path == null || index == null) return;
      wx.switchTab({
        url: path,
        success: () => this.setData({ selected: index })
      });
    }
  }
});
