// 菜谱上传页面

import { 
  submitRecipe,
  DIFFICULTY_OPTIONS,
  MEAL_TIME_OPTIONS,
  DISH_TYPE_OPTIONS,
  TAG_OPTIONS,
  Ingredient,
  RecipeStep,
  RecipeDifficulty
} from '../../../utils/cloudUserRecipe';
import { 
  uploadAvatarToCOS 
} from '../../../utils/fileUpload';
import { isLoggedIn } from '../../../utils/userAuth';

interface RecipeForm {
  title: string;
  coverImage: string;
  description: string;
  difficulty: RecipeDifficulty;
  cookingTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips: string;
  tags: string[];
  mealTimes: string[];
  dishTypes: string[];
}

Page({
  data: {
    // 表单数据
    form: {
      title: '',
      coverImage: '',
      description: '',
      difficulty: 'normal' as RecipeDifficulty,
      cookingTime: 30,
      servings: 2,
      ingredients: [] as Ingredient[],
      steps: [] as RecipeStep[],
      tips: '',
      tags: [] as string[],
      mealTimes: [] as string[],
      dishTypes: [] as string[]
    } as RecipeForm,
    
    // 临时输入
    tempIngredientName: '',
    tempIngredientAmount: '',
    tempStepDesc: '',
    
    // UI状态
    showIngredientInput: false,
    showStepInput: false,
    editingIngredientIndex: -1,
    editingStepIndex: -1,
    submitting: false,
    
    // 选项
    difficultyOptions: DIFFICULTY_OPTIONS,
    mealTimeOptions: MEAL_TIME_OPTIONS,
    dishTypeOptions: DISH_TYPE_OPTIONS,
    tagOptions: TAG_OPTIONS,
    
    // 时间选项
    cookingTimeOptions: [
      { value: 10, label: '10分钟' },
      { value: 20, label: '20分钟' },
      { value: 30, label: '30分钟' },
      { value: 45, label: '45分钟' },
      { value: 60, label: '60分钟' },
      { value: 90, label: '90分钟' },
      { value: 120, label: '2小时以上' }
    ],
    servingsOptions: [
      { value: 1, label: '1人份' },
      { value: 2, label: '2人份' },
      { value: 3, label: '3人份' },
      { value: 4, label: '4人份' },
      { value: 6, label: '6人份' },
      { value: 8, label: '8人份以上' }
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再上传菜谱',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/subpackages/lowfreq/login/index'
            });
          } else {
            wx.navigateBack();
          }
        }
      });
    }
  },

  // 选择封面图片
  onChooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });

        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: (readRes: any) => {
            uploadAvatarToCOS(readRes.data as string).then(url => {
              wx.hideLoading();
              if (url) {
                this.setData({
                  'form.coverImage': url
                });
                wx.showToast({ title: '封面上传成功', icon: 'success' });
              } else {
                wx.showToast({ title: '封面上传失败', icon: 'none' });
              }
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '读取图片失败', icon: 'none' });
          }
        });
      }
    });
  },

  // 输入标题
  onTitleInput(e: any) {
    this.setData({
      'form.title': e.detail.value
    });
  },

  // 输入简介
  onDescriptionInput(e: any) {
    this.setData({
      'form.description': e.detail.value
    });
  },

  // 输入小技巧
  onTipsInput(e: any) {
    this.setData({
      'form.tips': e.detail.value
    });
  },

  // 选择难度
  onSelectDifficulty(e: any) {
    const value = e.currentTarget.dataset.value as RecipeDifficulty;
    this.setData({
      'form.difficulty': value
    });
  },

  // 选择烹饪时间
  onSelectCookingTime(e: any) {
    const value = e.currentTarget.dataset.value as number;
    this.setData({
      'form.cookingTime': value
    });
  },

  // 选择份量
  onSelectServings(e: any) {
    const value = e.currentTarget.dataset.value as number;
    this.setData({
      'form.servings': value
    });
  },

  // ===== 食材管理 =====

  onShowIngredientInput() {
    this.setData({
      showIngredientInput: true,
      editingIngredientIndex: -1,
      tempIngredientName: '',
      tempIngredientAmount: ''
    });
  },

  onEditIngredient(e: any) {
    const index = e.currentTarget.dataset.index;
    const ingredient = this.data.form.ingredients[index];
    this.setData({
      showIngredientInput: true,
      editingIngredientIndex: index,
      tempIngredientName: ingredient.name,
      tempIngredientAmount: ingredient.amount
    });
  },

  onIngredientNameInput(e: any) {
    this.setData({
      tempIngredientName: e.detail.value
    });
  },

  onIngredientAmountInput(e: any) {
    this.setData({
      tempIngredientAmount: e.detail.value
    });
  },

  onConfirmIngredient() {
    const { tempIngredientName, tempIngredientAmount, editingIngredientIndex } = this.data;
    if (!tempIngredientName.trim()) {
      wx.showToast({ title: '请输入食材名称', icon: 'none' });
      return;
    }

    const ingredients = [...this.data.form.ingredients];
    const newIngredient: Ingredient = {
      name: tempIngredientName.trim(),
      amount: tempIngredientAmount.trim() || '适量'
    };

    if (editingIngredientIndex >= 0) {
      ingredients[editingIngredientIndex] = newIngredient;
    } else {
      ingredients.push(newIngredient);
    }

    this.setData({
      'form.ingredients': ingredients,
      showIngredientInput: false,
      tempIngredientName: '',
      tempIngredientAmount: ''
    });
  },

  onCancelIngredient() {
    this.setData({
      showIngredientInput: false,
      tempIngredientName: '',
      tempIngredientAmount: ''
    });
  },

  onDeleteIngredient(e: any) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个食材吗？',
      success: (res) => {
        if (res.confirm) {
          const ingredients = [...this.data.form.ingredients];
          ingredients.splice(index, 1);
          this.setData({
            'form.ingredients': ingredients
          });
        }
      }
    });
  },

  // ===== 步骤管理 =====

  onShowStepInput() {
    this.setData({
      showStepInput: true,
      editingStepIndex: -1,
      tempStepDesc: ''
    });
  },

  onEditStep(e: any) {
    const index = e.currentTarget.dataset.index;
    const step = this.data.form.steps[index];
    this.setData({
      showStepInput: true,
      editingStepIndex: index,
      tempStepDesc: step.description
    });
  },

  onStepDescInput(e: any) {
    this.setData({
      tempStepDesc: e.detail.value
    });
  },

  onConfirmStep() {
    const { tempStepDesc, editingStepIndex } = this.data;
    if (!tempStepDesc.trim()) {
      wx.showToast({ title: '请输入步骤描述', icon: 'none' });
      return;
    }

    const steps = [...this.data.form.steps];
    const newStep: RecipeStep = {
      description: tempStepDesc.trim()
    };

    if (editingStepIndex >= 0) {
      steps[editingStepIndex] = newStep;
    } else {
      steps.push(newStep);
    }

    this.setData({
      'form.steps': steps,
      showStepInput: false,
      tempStepDesc: ''
    });
  },

  onCancelStep() {
    this.setData({
      showStepInput: false,
      tempStepDesc: ''
    });
  },

  onDeleteStep(e: any) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个步骤吗？',
      success: (res) => {
        if (res.confirm) {
          const steps = [...this.data.form.steps];
          steps.splice(index, 1);
          this.setData({
            'form.steps': steps
          });
        }
      }
    });
  },

  // ===== 标签选择 =====

  onToggleTag(e: any) {
    const tag = e.currentTarget.dataset.value;
    const tags = [...this.data.form.tags];
    const index = tags.indexOf(tag);
    if (index >= 0) {
      tags.splice(index, 1);
    } else {
      tags.push(tag);
    }
    this.setData({
      'form.tags': tags
    });
  },

  onToggleMealTime(e: any) {
    const mealTime = e.currentTarget.dataset.value;
    const mealTimes = [...this.data.form.mealTimes];
    const index = mealTimes.indexOf(mealTime);
    if (index >= 0) {
      mealTimes.splice(index, 1);
    } else {
      mealTimes.push(mealTime);
    }
    this.setData({
      'form.mealTimes': mealTimes
    });
  },

  onToggleDishType(e: any) {
    const dishType = e.currentTarget.dataset.value;
    const dishTypes = [...this.data.form.dishTypes];
    const index = dishTypes.indexOf(dishType);
    if (index >= 0) {
      dishTypes.splice(index, 1);
    } else {
      dishTypes.push(dishType);
    }
    this.setData({
      'form.dishTypes': dishTypes
    });
  },

  // ===== 提交表单 =====

  async onSubmit() {
    const { form } = this.data;

    // 验证必填项
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入菜谱标题', icon: 'none' });
      return;
    }
    if (!form.coverImage) {
      wx.showToast({ title: '请上传封面图片', icon: 'none' });
      return;
    }
    if (form.ingredients.length === 0) {
      wx.showToast({ title: '请添加至少一个食材', icon: 'none' });
      return;
    }
    if (form.steps.length === 0) {
      wx.showToast({ title: '请添加至少一个步骤', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const result = await submitRecipe({
        title: form.title.trim(),
        coverImage: form.coverImage,
        description: form.description.trim(),
        difficulty: form.difficulty,
        cookingTime: form.cookingTime,
        servings: form.servings,
        ingredients: form.ingredients,
        steps: form.steps,
        tips: form.tips.trim(),
        tags: form.tags,
        mealTimes: form.mealTimes,
        dishTypes: form.dishTypes
      });

      wx.hideLoading();

      if (result.success) {
        wx.showModal({
          title: '提交成功',
          content: '您的菜谱已提交，等待审核通过后即可在社区展示',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' });
        this.setData({ submitting: false });
      }
    } catch (err: any) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '提交失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  // 阻止默认事件
  preventTouchMove() {
    return false;
  }
});
