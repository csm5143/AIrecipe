// 统一的标签转换工具

// 难度标签映射
export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  normal: '一般',
  hard: '挑战'
};

// 用餐时段标签映射
export const MEAL_TIME_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  late_night: '夜宵'
};

// 菜品类型标签映射
export const DISH_TYPE_LABELS: Record<string, string> = {
  main: '主食',
  cold: '凉菜',
  boiled: '煮食',
  soup: '汤品',
  porridge: '粥',
  noodles: '面食',
  dessert: '甜品',
  drink: '饮品',
  braised: '卤味',
  bbq: '烧烤',
  hotpot: '火锅',
  western: '西餐',
  fried: '油炸',
  baked: '烘焙',
  sashimi: '刺身',
  diet: '减脂餐',
  stir_fried_staple: '炒食',
  stir_fry: '小炒菜',
  children: '儿童餐'
};

/**
 * 获取难度标签
 * @param difficulty 难度值
 * @returns 难度标签
 */
export function getDifficultyLabel(difficulty: string): string {
  return DIFFICULTY_LABELS[difficulty] || '简单';
}

/**
 * 获取用餐时段标签
 * @param mealTime 用餐时段值
 * @returns 用餐时段标签
 */
export function getMealTimeLabel(mealTime: string): string {
  return MEAL_TIME_LABELS[mealTime] || '';
}

/**
 * 获取用餐时段标签列表
 * @param mealTimes 用餐时段数组
 * @returns 用餐时段标签数组
 */
export function getMealTimeLabels(mealTimes: string[]): string[] {
  return mealTimes.map(getMealTimeLabel).filter(Boolean);
}

/**
 * 获取用餐时段标签字符串（用 / 分隔）
 * @param mealTimes 用餐时段数组
 * @returns 用餐时段标签字符串
 */
export function getMealTimeLabelString(mealTimes: string[]): string {
  return getMealTimeLabels(mealTimes).join(' / ');
}

/**
 * 获取菜品类型标签
 * @param dishType 菜品类型值
 * @returns 菜品类型标签
 */
export function getDishTypeLabel(dishType: string): string {
  return DISH_TYPE_LABELS[dishType] || '';
}

/**
 * 获取菜品类型标签列表
 * @param dishTypes 菜品类型数组
 * @returns 菜品类型标签数组
 */
export function getDishTypeLabels(dishTypes: string[]): string[] {
  return dishTypes.map(getDishTypeLabel).filter(Boolean);
}

/**
 * 获取主要分类标签（优先显示减脂餐、小炒菜、炒食、煮食等特殊类型）
 * @param dishTypes 菜品类型数组
 * @param mealTimes 用餐时段数组（作为备选）
 * @param showWesternTag 是否在主要分类中显示西餐标签，默认 false（西餐标签只在西餐分类页显示）
 * @returns 主要分类标签
 */
export function getPrimaryCategoryLabel(
  dishTypes: string[],
  mealTimes: string[],
  showWesternTag: boolean = false
): string {
  if (dishTypes && dishTypes.length > 0) {
    // 优先检查是否包含减脂餐、儿童餐、小炒菜、炒食、煮食等特殊类型，如果包含则优先显示对应类型
    // western（西餐）标签默认不在主标签显示，只在西餐分类页显示
    if (dishTypes.includes('diet')) {
      return DISH_TYPE_LABELS['diet'] || '';
    } else if (dishTypes.includes('children')) {
      return DISH_TYPE_LABELS['children'] || '';
    } else if (dishTypes.includes('stir_fry')) {
      return DISH_TYPE_LABELS['stir_fry'] || '';
    } else if (dishTypes.includes('stir_fried_staple')) {
      return DISH_TYPE_LABELS['stir_fried_staple'] || '';
    } else if (dishTypes.includes('boiled')) {
      return DISH_TYPE_LABELS['boiled'] || '';
    } else if (showWesternTag && dishTypes.includes('western')) {
      return DISH_TYPE_LABELS['western'] || '';
    } else {
      return DISH_TYPE_LABELS[dishTypes[0]] || '';
    }
  }

  // 如果没有菜品类型，使用用餐时段作为主要分类
  if (mealTimes && mealTimes.length > 0) {
    return MEAL_TIME_LABELS[mealTimes[0]] || '';
  }

  return '';
}

/**
 * 获取次要分类标签列表
 * @param dishTypes 菜品类型数组
 * @param mealTimes 用餐时段数组
 * @param primaryCategoryLabel 主要分类标签
 * @returns 次要分类标签数组
 */
export function getSecondaryCategoryLabels(
  dishTypes: string[],
  mealTimes: string[],
  primaryCategoryLabel: string
): string[] {
  const secondaryLabels: string[] = [];

  // 粥 / 面食：无论主标签是什么，只要菜品包含这些类型，就应在卡片上稳定展示
  // 并且放在次要标签最前面，方便用户快速识别与筛选联想一致
  // 同时排除 western（西餐标签只在西餐分类页的主标签位置显示）
  if (dishTypes && dishTypes.length > 0) {
    if (dishTypes.includes('porridge') && primaryCategoryLabel !== (DISH_TYPE_LABELS['porridge'] || '粥')) {
      const label = DISH_TYPE_LABELS['porridge'];
      if (label && !secondaryLabels.includes(label)) secondaryLabels.push(label);
    }
    if (dishTypes.includes('noodles') && primaryCategoryLabel !== (DISH_TYPE_LABELS['noodles'] || '面食')) {
      const label = DISH_TYPE_LABELS['noodles'];
      if (label && !secondaryLabels.includes(label)) secondaryLabels.push(label);
    }
    // 过滤掉 western；且与主标签相同的类型不再重复展示（避免「儿童餐」出现两次）
    const filteredDishTypes = dishTypes.filter((dt) => dt !== 'western');
    filteredDishTypes.forEach((dt) => {
      const label = DISH_TYPE_LABELS[dt];
      if (label && label !== primaryCategoryLabel && !secondaryLabels.includes(label)) {
        secondaryLabels.push(label);
      }
    });
  }

  // 如果主要分类是减脂餐、儿童餐、小炒菜、炒食或煮食，检查 dishTypes 中是否还有其他类型需要显示
  if (
    (primaryCategoryLabel === '减脂餐' ||
      primaryCategoryLabel === '儿童餐' ||
      primaryCategoryLabel === '小炒菜' ||
      primaryCategoryLabel === '炒食' ||
      primaryCategoryLabel === '煮食') &&
    dishTypes &&
    dishTypes.length > 1
  ) {
    // 排除 diet、children、stir_fry、stir_fried_staple、boiled，将其他类型添加到次要标签
    dishTypes.forEach((dt) => {
      if (
        dt !== 'diet' &&
        dt !== 'children' &&
        dt !== 'stir_fry' &&
        dt !== 'stir_fried_staple' &&
        dt !== 'boiled'
      ) {
        const label = DISH_TYPE_LABELS[dt];
        if (label && label !== primaryCategoryLabel && !secondaryLabels.includes(label)) {
          secondaryLabels.push(label);
        }
      }
    });
  }

  // 用餐时段作为次要分类（如果主要分类是菜品类型）
  if (
    dishTypes &&
    dishTypes.length > 0 &&
    mealTimes &&
    mealTimes.length > 0
  ) {
    mealTimes.forEach((t) => {
      const label = MEAL_TIME_LABELS[t];
      if (label && !secondaryLabels.includes(label)) {
        secondaryLabels.push(label);
      }
    });
  }

  return secondaryLabels;
}
