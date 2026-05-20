// 定制页面：小菜篮 + 横向菜单卡片流 + 健身减脂餐 + 儿童营养餐

import { getTotalIngredientCount, getRecipeCount } from '../../utils/shoppingList.js';
import { authService } from '../../utils/services/authService.js';

interface MenuCard {
  id: string;
  cover: string;
  labelTitle: string;
  labelExtra: string;
  showCalendarBadge: boolean;
  description: string;
  navType: 'list' | 'meal' | 'dish' | 'search' | 'discover' | 'daily' | 'hot';
  navValue: string;
}

Page({
  data: {
    basketCount: 0,
    basketRecipeCount: 0,
    menuCards: [] as MenuCard[],
  },

  onLoad() {
    this.refreshBasket();
    this.initMenuCards();
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) {
      tab.setData({ selected: 1 });
    }
    this.refreshBasket();
  },

  refreshBasket() {
    const basketCount = getTotalIngredientCount();
    const basketRecipeCount = getRecipeCount();
    this.setData({ basketCount, basketRecipeCount });
  },

  initMenuCards() {
    const menuCards: MenuCard[] = [
      {
        id: 'm2',
        cover: 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E5%AE%AB%E4%BF%9D%E9%B8%A1%E4%B8%81.png',
        labelTitle: '本周热门',
        labelExtra: '',
        showCalendarBadge: false,
        description: '热门爆款 · 跟做不踩雷',
        navType: 'hot',
        navValue: ''
      },
      {
        id: 'm3',
        cover: 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E7%BA%A2%E7%83%A7%E8%82%89.png',
        labelTitle: '新菜首发',
        labelExtra: '',
        showCalendarBadge: false,
        description: '尝鲜优选 · 每周上新',
        navType: 'discover',
        navValue: 'new'
      },
      {
        id: 'm4',
        cover: 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E5%8F%AF%E4%B9%90%E9%B8%A1%E7%BF%85.png',
        labelTitle: '家常菜',
        labelExtra: '',
        showCalendarBadge: false,
        description: '下饭耐吃 · 日常必备',
        navType: 'discover',
        navValue: 'home'
      },
      {
        id: 'm5',
        cover: 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E6%A4%92%E7%9B%90%E8%99%BE.png',
        labelTitle: '一人食谱',
        labelExtra: '',
        showCalendarBadge: false,
        description: '简单快手 · 一人也要吃好',
        navType: 'discover',
        navValue: 'solo'
      }
    ];
    this.setData({ menuCards });
  },

  onGoToBasket() {
    if (!authService.isLoggedIn()) {
      authService.requireAuth(() => {
        wx.navigateTo({ url: '/pages/basket/index' });
      });
      return;
    }
    wx.navigateTo({ url: '/pages/basket/index' });
  },

  onGoToFitness() {
    if (!authService.isLoggedIn()) {
      authService.requireAuth(() => {
        this.navigateToFitness();
      });
      return;
    }
    this.navigateToFitness();
  },

  navigateToFitness() {
    try {
      const goal = wx.getStorageSync('fitnessGoal');
      if (goal && typeof goal === 'object' && String((goal as { goal?: string }).goal || '').trim()) {
        wx.navigateTo({ url: '/subpackages/lowfreq/fitness-menu/index' });
        return;
      }
    } catch (_e) {}
    wx.navigateTo({ url: '/subpackages/lowfreq/fitness/index' });
  },

  onGoToKids() {
    if (!authService.isLoggedIn()) {
      authService.requireAuth(() => {
        this.navigateToKids();
      });
      return;
    }
    this.navigateToKids();
  },

  navigateToKids() {
    try {
      const stage = wx.getStorageSync('childrenStage');
      if (stage && typeof stage === 'object' && String((stage as { stage?: string }).stage || '').trim()) {
        wx.navigateTo({ url: '/subpackages/lowfreq/kids-menu/index' });
        return;
      }
    } catch (_e) {}
    wx.navigateTo({ url: '/subpackages/lowfreq/kids/index' });
  },

  onMenuCardTap(e: any) {
    const index = Number(e.currentTarget.dataset.index);
    const cards = this.data.menuCards as MenuCard[];
    const card = cards[index];
    if (!card) return;
    const { navType, navValue } = card;
    if (navType === 'daily') {
      wx.navigateTo({ url: '/subpackages/lowfreq/daily/index' });
      return;
    }
    if (navType === 'list') {
      wx.navigateTo({ url: '/pages/recipes/list' });
      return;
    }
    if (navType === 'meal') {
      wx.navigateTo({
        url: '/pages/recipes/list?presetMeal=' + encodeURIComponent(navValue)
      });
      return;
    }
    if (navType === 'dish') {
      wx.navigateTo({
        url: '/pages/recipes/list?presetDish=' + encodeURIComponent(navValue)
      });
      return;
    }
    if (navType === 'search') {
      wx.navigateTo({
        url: '/pages/recipes/list?q=' + encodeURIComponent(navValue)
      });
      return;
    }
    if (navType === 'hot') {
      wx.navigateTo({ url: '/pages/recipes/list?isHot=1' });
      return;
    }
    if (navType === 'discover') {
      const titleMap: Record<string, string> = {
        internet: '本周热门',
        new: '新菜首发',
        home: '家常菜',
        solo: '一人食谱'
      };
      const displayTitle = titleMap[navValue] || '发现菜谱';
      wx.navigateTo({
        url: `/subpackages/lowfreq/discover-list/index?type=${navValue}&title=${encodeURIComponent(displayTitle)}`
      });
    }
  }
});
