// 食材相关的工具函数
/**

 * 将常见调味料名称映射为一个"默认用量提示"，用于在菜谱详情里展示更友好的勺数/克数。

 * 如果没有命中任何规则，则返回"适量"。

 */

export function getIngredientAmountHint(name: string): string {

  // 统一一下全角/半角空格

  const n = (name || '').trim();

  switch (n) {
    // 基础咸味/甜味
    case '盐':
      return '1/2小勺（约 2–3g）';

    case '糖':
    case '白糖':
      return '1小勺（约 4–5g）';

    case '冰糖':
      return '几小块（约 10g 左右，可按口味增减）';

    case '蜂蜜':
    case '红糖':
      return '1小勺（约 4–5g，可按甜度调整）';

    // 酱油/酱类

    case '酱油':
    case '生抽':
      return '1大勺（约 10–15ml）';

    case '老抽':
      return '1/2大勺（约 5–8ml，用于上色为主）';

    case '蚝油':
      return '1大勺（约 10–15ml）';

    case '料酒':
      return '1大勺（约 10–15ml，去腥用）';

    case '黄酒':
    case '花雕酒':
      return '1大勺（约 10–15ml，炖煮类可略多）';

    case '香油':
      return '1小勺（约 3–5ml，出锅前淋）';

    case '番茄酱':
      return '1大勺（约 15g，可按酸甜口调整）';

    // 酸味

    case '香醋':
    case '陈醋':
      return '1大勺（约 10–15ml，可按酸度调整）';

    case '醋':
    case '柠檬汁':
      return '1大勺（约 10–15ml，可按口味增减）';

    // 辣味/香辛料

    case '黑胡椒':
    case '黑胡椒粉':
    case '白胡椒粉':
    case '胡椒粉':
      return '少许（约 1/4 小勺，按口味增减）';

    case '干辣椒':
    case '辣椒粉':
    case '辣椒面':
      return '适量（建议从 1/2 小勺起，视辣度调整）';

    case '花椒':
    case '花椒粉':
      return '少许（约 1/4 小勺，炒香后出味即可）';

    case '孜然粉':
      return '1/2小勺（约 2–3g，可按口味调整）';

    case '五香粉':
      return '少许（约 1/4 小勺，不宜过多）';

    // 其它常见调味配料

    case '蒜瓣':
      return '2–3瓣（切片或拍碎均可）';

    case '姜':
      return '3–5片（或等量姜末）';

    case '葱花':
      return '一小把（约 5–10g，出锅前撒）';

    case '食用油':
    case '橄榄油':
      return '1–2大勺（视锅具和菜量调整）';

    case '淀粉':
      return '1小勺（兑水调成水淀粉使用）';

    case '鸡精':
      return '少许（约 1/4 小勺，可按口味调整）';

    case '可乐':
      return '半罐左右（约 150ml，用于卤煮或收汁）';

    default:
      return '适量';
  }
}



/**

 * 食材"别名/可由其制作"的弱兼容：

 * - 你选了「大米」：默认也能做出「米饭 / 隔夜米饭」

 * - 你选了「挂面」：默认也能做出「面条」

 * 这样即便旧数据里还写着"米饭/面条"，也不会导致匹配掉光。

 * @param userIngredients 用户已选食材数组
 * @returns 扩展后的食材数组
 */

export function expandUserIngredients(userIngredients: string[]): string[] {
  const base = Array.isArray(userIngredients) ? userIngredients : [];
  const set = new Set<string>(base.filter((x) => !!x));

  // 大米 -> 米饭/隔夜米饭
  if (set.has('大米')) {
    set.add('米饭');
    set.add('隔夜米饭');
  }
  if (set.has('挂面')) {
    set.add('面条');
  }

  // 反向兼容：如果旧数据里只有"米饭/面条"，也能命中新的"基础食材"
  if (set.has('米饭') || set.has('隔夜米饭')) {
    set.add('大米');
  }
  if (set.has('面条')) {
    set.add('挂面');
  }

  // 蜂蜜 -> 扩展到常见甜味/调味蜂蜜的饮品和菜品
  // 蜂蜜在一些饮品（如蜂蜜柠檬水、蜂蜜柚子茶）中是核心食材，
  // 需要与常见饮品原料关联以便匹配
  if (set.has('蜂蜜')) {
    set.add('柠檬');
    set.add('柚子');
    set.add('百香果');
    set.add('金桔');
  }

  // 葱类食材扩展：小葱/香葱/葱/细葱 → 葱花
  // 用户有这些葱类食材时，可以匹配使用"葱花"的菜谱
  const SCALLION_INGREDIENTS = ['小葱', '香葱', '葱', '细葱', '细香葱'];
  if (SCALLION_INGREDIENTS.some(name => set.has(name))) {
    set.add('葱花');
  }

  // 家常食材的"同类/同义词"弱兼容
  const CHICKEN_BONELESS_GROUP = ['鸡肉', '鸡胸肉', '鸡腿', '鸡腿肉', '鸡里脊'];
  const CHICKEN_WING_GROUP = ['鸡翅', '鸡翅中', '鸡翅根'];
  const CHICKEN_FEET_GROUP = ['鸡爪', '凤爪'];
  const CHICKEN_WHOLE = '整鸡';

  // 整鸡：可拆解覆盖到常见鸡肉部位
  if (set.has(CHICKEN_WHOLE)) {
    [...CHICKEN_BONELESS_GROUP, ...CHICKEN_WING_GROUP, ...CHICKEN_FEET_GROUP, CHICKEN_WHOLE].forEach((n) => set.add(n));
  }

  // 无骨鸡肉类：互通（但不扩展到鸡翅/鸡爪）
  if (CHICKEN_BONELESS_GROUP.some((name) => set.has(name))) {
    CHICKEN_BONELESS_GROUP.forEach((name) => set.add(name));
  }

  // 鸡翅类：互通
  if (CHICKEN_WING_GROUP.some((name) => set.has(name))) {
    CHICKEN_WING_GROUP.forEach((name) => set.add(name));
  }

  // 鸡爪类：互通
  if (CHICKEN_FEET_GROUP.some((name) => set.has(name))) {
    CHICKEN_FEET_GROUP.forEach((name) => set.add(name));
  }

  const ALIAS_GROUPS: string[][] = [
    // 猪肉家族
    ['猪肉', '五花肉', '梅花肉', '里脊', '猪里脊'],
    // 番茄 / 西红柿
    ['番茄', '西红柿'],
    // 菌菇类：香菇 / 平菇
    ['香菇', '平菇'],
    // 鱼类：鱼 / 鱼肉 / 鱼片 互通
    ['鱼', '鱼肉', '鱼片']
  ];

  for (const group of ALIAS_GROUPS) {
    if (group.some((name) => set.has(name))) {
      group.forEach((name) => set.add(name));
    }
  }

  // 单向弱兼容：细分牛肉食材 -> 牛肉
  if (set.has('牛里脊') || set.has('牛腩') || set.has('牛排') || set.has('牛腱子肉') || set.has('牛腱')) {
    set.add('牛肉');
  }

  // 虾类：整虾（基围虾/大虾）可以去做虾仁菜
  // 但虾仁不能反做整虾的菜（如油焖大虾需要带壳虾，虾仁做不了）
  if (set.has('基围虾') || set.has('大虾')) {
    set.add('虾仁');  // 整虾可以制作虾仁菜
  }
  // 虾仁不扩展到基围虾/大虾，保持单向兼容

  return Array.from(set);
}



/**

 * 针对"鸡肉可以弱兼容部分部位，但有少数（按菜名）必须严格区分部位"的规则，

 * 在判定某个食材是否"已拥有"时做一个温和的修正。

 * 大多数情况下：无骨鸡肉类互通（鸡里脊 ≈ 鸡胸肉/鸡腿肉），保持"家常能做就推荐"的体验；

 * 但如果菜名里明确强调了部位，则必须严格校验。

 */

export function isIngredientOwnedWithChickenExceptions(
  ingredientName: string,
  recipeName: string | undefined,
  userIngredients: string[],
  expandedUserIngredients: string[]
): boolean {
  // 基础规则：先看扩展后的食材是否覆盖
  const baseOwned = expandedUserIngredients.indexOf(ingredientName) !== -1;
  if (!baseOwned) return false;

  const name = recipeName || '';

  // ========== 鸡类 ==========
  const requiresLegByName = name.includes('鸡腿');
  const requiresBreastByName = name.includes('鸡胸');
  const requiresWingByName = name.includes('鸡翅') || name.includes('翅中') || name.includes('翅根');
  const requiresFeetByName = name.includes('鸡爪') || name.includes('凤爪');

  const hasAny = (candidates: string[]) => candidates.some((x) => userIngredients.includes(x));
  const hasWholeChicken = userIngredients.includes('整鸡');

  // 菜名强调"鸡腿"时：只有真·鸡腿/鸡腿肉才算拥有
  if (requiresLegByName && (ingredientName === '鸡腿' || ingredientName === '鸡腿肉')) {
    return hasWholeChicken || hasAny(['鸡腿', '鸡腿肉']);
  }

  // 菜名强调"鸡胸"时：只有真·鸡胸肉才算拥有
  if (requiresBreastByName && ingredientName === '鸡胸肉') {
    return hasWholeChicken || userIngredients.includes('鸡胸肉');
  }

  // 菜名强调"鸡翅"时：必须真·鸡翅/翅中/翅根（或整鸡���
  if (requiresWingByName && (ingredientName === '鸡翅' || ingredientName === '鸡翅中' || ingredientName === '鸡翅根')) {
    return hasWholeChicken || hasAny(['鸡翅', '鸡翅中', '鸡翅根']);
  }

  // 菜名强调"鸡爪/凤爪"时：必须真·鸡爪/凤爪（或整鸡）
  if (requiresFeetByName && (ingredientName === '鸡爪' || ingredientName === '凤爪')) {
    return hasWholeChicken || hasAny(['鸡爪', '凤爪']);
  }

  // ========== 虾类 ==========
  // 整虾（基围虾/大虾）和虾仁单向兼容：
  // - 用户有整虾 → 可以做虾仁菜（去壳即可）
  // - 用户只有虾仁 → 不能做整虾菜（如油焖大虾需要带壳虾）
  if (ingredientName === '基围虾' || ingredientName === '大虾') {
    // 整虾：用户需要有基围虾或大虾（或通过 expandUserIngredients 扩展）
    return baseOwned;
  }
  if (ingredientName === '虾仁') {
    // 虾仁：用户需要有虾仁，或者有基围虾/大虾（整虾可以制作虾仁菜）
    return userIngredients.includes('虾仁') ||
           userIngredients.includes('基围虾') ||
           userIngredients.includes('大虾');
  }

  // 其它情况：保持原有的弱兼容逻辑
  return baseOwned;
}
