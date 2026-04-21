// pages/custom/kids/index.ts
// 儿童营养餐定制向导页

Page({
  data: {
    currentStep: 1,
    totalSteps: 3,

    // Step 1 — 年龄段
    stage: '',
    stageLabel: '',

    // Step 2 — 过敏原
    allergies: [] as string[],

    // Step 3 — 用餐时段
    mealTimes: [] as string[],
  },

  onLoad() {
    this.loadSavedConfig();
  },

  loadSavedConfig() {
    const savedStage = wx.getStorageSync('childrenStage');
    const savedAllergies = wx.getStorageSync('childrenAllergies');
    const savedMealTimes = wx.getStorageSync('childrenMealTimes');

    if (savedStage) {
      this.setData({
        stage: savedStage.stage,
        stageLabel: savedStage.stageLabel,
        allergies: savedAllergies || [],
        mealTimes: savedMealTimes || []
      });
    }
  },

  onSelectStage(e: WechatMiniprogram.BaseEvent) {
    const stage = e.currentTarget.dataset.stage as string;
    const labels: Record<string, string> = {
      toddler: '1-2岁 · 辅食期',
      preschool: '3-6岁 · 幼童期',
      school: '7-12岁 · 学龄期'
    };
    const stageData = { stage, stageLabel: labels[stage] || '' };
    wx.setStorageSync('childrenStage', stageData);
    this.setData({ stage, stageLabel: labels[stage] || '', currentStep: 2 });
  },

  onToggleAllergy(e: WechatMiniprogram.BaseEvent) {
    const val = e.currentTarget.dataset.val as string;
    let list = [...this.data.allergies] as string[];

    if (val === 'none') {
      if (list.includes('none')) {
        list = list.filter(item => item !== 'none');
      } else {
        list = ['none'];
      }
    } else {
      if (list.includes(val)) {
        list = list.filter(item => item !== val);
      } else {
        list = list.filter(item => item !== 'none');
        list.push(val);
      }
    }

    wx.setStorageSync('childrenAllergies', list);
    this.setData({ allergies: list });
  },

  onNextFromAllergy() {
    if (this.data.allergies.length > 0) {
      wx.setStorageSync('childrenAllergies', this.data.allergies);
    }
    this.setData({ currentStep: 3 });
  },

  onToggleMealTime(e: WechatMiniprogram.BaseEvent) {
    const val = e.currentTarget.dataset.val as string;
    let list = [...this.data.mealTimes] as string[];
    const idx = list.indexOf(val);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(val);
    }
    wx.setStorageSync('childrenMealTimes', list);
    this.setData({ mealTimes: list });
  },

  onGoBack() {
    const { currentStep } = this.data;
    if (currentStep > 1) {
      this.setData({ currentStep: currentStep - 1 });
    } else {
      wx.navigateBack();
    }
  },

  onGenerate() {
    const { stage, allergies, mealTimes } = this.data;

    if (stage) {
      const labels: Record<string, string> = {
        toddler: '1-2岁 · 辅食期',
        preschool: '3-6岁 · 幼童期',
        school: '7-12岁 · 学龄期'
      };
      wx.setStorageSync('childrenStage', { stage, stageLabel: labels[stage] || '' });
    }

    if (allergies.length > 0) {
      wx.setStorageSync('childrenAllergies', allergies);
    }

    wx.setStorageSync('childrenMealTimes', mealTimes);
    wx.redirectTo({ url: '/subpackages/lowfreq/kids-menu/index' });
  }
});
