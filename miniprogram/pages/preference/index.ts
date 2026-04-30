/**
 * 偏好设置页面
 * 饮食偏好、口味偏好、食材偏好等设置
 */

import {
  getPreferences,
  savePreferences,
  toggleRestriction,
  toggleDietMode,
  toggleTastePreference,
  toggleIngredientPreference,
  toggleCuisinePreference,
  resetPreferences,
  getPreferenceStats,
  DIETARY_RESTRICTIONS,
  DIETARY_MODES,
  TASTE_PREFERENCES,
  INGREDIENT_PREFERENCES,
  CUISINE_PREFERENCES,
  type UserPreferences
} from '../../utils/preferenceStore';

Page({
  data: {
    // 当前偏好设置
    preferences: {} as UserPreferences,
    stats: {
      restrictions: 0,
      dietModes: 0,
      tastePreferences: 0,
      ingredientPreferences: 0,
      cuisinePreferences: 0,
      total: 0
    },
    // 选项数据
    dietaryRestrictions: DIETARY_RESTRICTIONS,
    dietModes: DIETARY_MODES,
    tastePreferences: TASTE_PREFERENCES,
    ingredientPreferences: INGREDIENT_PREFERENCES,
    cuisinePreferences: CUISINE_PREFERENCES,
    // 展开状态
    expandedSections: ['restrictions', 'dietModes'] as string[],
  },

  onLoad() {
    this.loadPreferences();
  },

  onShow() {
    this.loadPreferences();
  },

  loadPreferences() {
    const preferences = getPreferences();
    const stats = getPreferenceStats();
    this.setData({ preferences, stats });
  },

  // 切换展开状态
  toggleSection(e: WechatMiniprogram.BaseEvent) {
    const section = e.currentTarget.dataset.section as string;
    const { expandedSections } = this.data;
    const idx = expandedSections.indexOf(section);
    if (idx > -1) {
      expandedSections.splice(idx, 1);
    } else {
      expandedSections.push(section);
    }
    this.setData({ expandedSections });
  },

  // 判断选项是否选中
  isSelected(type: string, value: string): boolean {
    const { preferences } = this.data;
    switch (type) {
      case 'restrictions':
        return preferences.restrictions.includes(value);
      case 'dietModes':
        return preferences.dietModes.includes(value);
      case 'tastePreferences':
        return preferences.tastePreferences.includes(value);
      case 'ingredientPreferences':
        return preferences.ingredientPreferences.includes(value);
      case 'cuisinePreferences':
        return preferences.cuisinePreferences.includes(value);
      default:
        return false;
    }
  },

  // 切换饮食忌口
  onToggleRestriction(e: WechatMiniprogram.BaseEvent) {
    const value = e.currentTarget.dataset.value as string;
    toggleRestriction(value);
    this.loadPreferences();
  },

  // 切换饮食模式
  onToggleDietMode(e: WechatMiniprogram.BaseEvent) {
    const value = e.currentTarget.dataset.value as string;
    toggleDietMode(value);
    this.loadPreferences();
  },

  // 切换口味偏好
  onToggleTaste(e: WechatMiniprogram.BaseEvent) {
    const value = e.currentTarget.dataset.value as string;
    toggleTastePreference(value);
    this.loadPreferences();
  },

  // 切换食材偏好
  onToggleIngredient(e: WechatMiniprogram.BaseEvent) {
    const value = e.currentTarget.dataset.value as string;
    toggleIngredientPreference(value);
    this.loadPreferences();
  },

  // 切换菜系偏好
  onToggleCuisine(e: WechatMiniprogram.BaseEvent) {
    const value = e.currentTarget.dataset.value as string;
    toggleCuisinePreference(value);
    this.loadPreferences();
  },

  // 重置所有设置
  onReset() {
    wx.showModal({
      title: '重置偏好设置',
      content: '确定要清除所有偏好设置吗？',
      confirmText: '重置',
      confirmColor: '#cf2d56',
      success: (res) => {
        if (res.confirm) {
          resetPreferences();
          this.loadPreferences();
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },
});
