// pages/custom/fitness/index.ts
// 健身减脂增肌定制页

Page({
  data: {
    // 步骤指示器
    currentStep: 1,
    totalSteps: 3,

    // Step 1 — 目标
    goal: '',           // 'lose' | 'keep' | 'gain'
    goalLabel: '',

    // Step 2 — 过敏原
    allergies: [] as string[],

    // Step 3 — 用餐时段
    mealTimes: [] as string[],        // 'breakfast' | 'lunch' | 'dinner'
  },

  onLoad() {
    // 从缓存加载已保存的配置
    this.loadSavedConfig();
  },

  // 加载已保存的配置
  loadSavedConfig() {
    const savedGoal = wx.getStorageSync('fitnessGoal');
    const savedAllergies = wx.getStorageSync('fitnessAllergies');
    const savedMealTimes = wx.getStorageSync('fitnessMealTimes');

    if (savedGoal) {
      this.setData({
        goal: savedGoal.goal,
        goalLabel: savedGoal.goalLabel,
        allergies: savedAllergies || [],
        mealTimes: savedMealTimes || []
      });
    }
  },

  // ── Step 1：目标选择 ──────────────────────────────

  onSelectGoal(e: WechatMiniprogram.BaseEvent) {
    const goal = e.currentTarget.dataset.goal as string;
    const labels: Record<string, string> = {
      lose: '减脂',
      keep: '维持',
      gain: '增肌'
    };
    // 保存目标
    const goalData = { goal, goalLabel: labels[goal] || '' };
    wx.setStorageSync('fitnessGoal', goalData);
    
    this.setData({ goal, goalLabel: labels[goal] || '', currentStep: 2 });
  },

  // ── Step 2：过敏原 ────────────────────────────────

  onToggleAllergy(e: WechatMiniprogram.BaseEvent) {
    const val = e.currentTarget.dataset.val as string;
    let list = [...this.data.allergies] as string[];

    // 互斥逻辑：无过敏与其他过敏源不能同时选
    if (val === 'none') {
      if (list.includes('none')) {
        list = list.filter(item => item !== 'none');
      } else {
        // 选中无过敏，移除其他过敏源
        list = ['none'];
      }
    } else {
      // 选中其他过敏源时，移除无过敏
      if (list.includes(val)) {
        list = list.filter(item => item !== val);
      } else {
        list = list.filter(item => item !== 'none');
        list.push(val);
      }
    }

    // 保存过敏原配置
    wx.setStorageSync('fitnessAllergies', list);
    this.setData({ allergies: list });
  },

  onNextFromAllergy() {
    // 保存过敏原配置（如果还没有保存）
    if (this.data.allergies.length > 0) {
      wx.setStorageSync('fitnessAllergies', this.data.allergies);
    }
    this.setData({ currentStep: 3 });
  },

  // ── Step 3：用餐时段 ──────────────────────────────

  onToggleMealTime(e: WechatMiniprogram.BaseEvent) {
    const val = e.currentTarget.dataset.val as string;
    let list = [...this.data.mealTimes] as string[];
    const idx = list.indexOf(val);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(val);
    }
    // 保存时段配置
    wx.setStorageSync('fitnessMealTimes', list);
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

  // ── 生成 ──────────────────────────────────────────

  onGenerate() {
    const { goal, allergies, mealTimes } = this.data;

    // 确保配置已保存
    if (goal) {
      const labels: Record<string, string> = {
        lose: '减脂',
        keep: '维持',
        gain: '增肌'
      };
      wx.setStorageSync('fitnessGoal', { goal, goalLabel: labels[goal] || '' });
    }
    
    if (allergies.length > 0) {
      wx.setStorageSync('fitnessAllergies', allergies);
    }
    
    wx.setStorageSync('fitnessMealTimes', mealTimes);

    // 跳转到专属减脂菜单页面（使用 redirectTo 替换当前页，避免返回到配置向导）
    wx.redirectTo({ url: '/subpackages/lowfreq/fitness-menu/index' });
  }
});
