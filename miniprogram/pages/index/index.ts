/**
 * 首页热门菜品数据
 * 优先从本地 hotRecipes.json 读取，后台异步从云端刷新
 */
import { loadRecipesJson } from '../../utils/dataLoader';

interface HotDish {
  id: string;
  name: string;
  coverUrl: string;
  category: string;
}

interface HotRecipesRaw {
  lastUpdated: string;
  description: string;
  hotRecipes: HotDish[];
}

/**
 * 加载本地热门菜谱数据
 */
function loadHotRecipesData(): HotDish[] {
  try {
    const fsm = wx.getFileSystemManager();
    const candidates = [
      'data/hotRecipes.json',
      '/data/hotRecipes.json',
      '/miniprogram/data/hotRecipes.json'
    ];
    for (const p of candidates) {
      try {
        const content = fsm.readFileSync(p, 'utf8') as string;
        if (content && content.trim()) {
          const parsed = JSON.parse(content) as HotRecipesRaw;
          return parsed.hotRecipes || [];
        }
      } catch (_e) {}
    }
  } catch (_e) {}
  return [];
}

// 本地热门菜库数据
const hotRecipesData = loadHotRecipesData();

const HOT_RECIPES_PER_DAY = 24; // 每天展示24道热门菜
const INITIAL_COUNT = 12;       // 首次展示数量
const LOAD_COUNT = 6;           // 每次追加数量

// IntersectionObserver 实例（运行时动态创建，模块级变量避免小程序编译问题）
let _observer: any = null;

/**
 * 基于日期的确定性伪随机数生成器
 * 同一天调用返回相同的随机顺序
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * 将日期字符串转为数字种子
 */
function dateToSeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

/**
 * 打乱数组（基于种子）
 */
function shuffleArray<T>(arr: T[], random: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 从本地热门菜库加载当日菜品（立即返回）
 */
function getLocalHotRecipes(): HotDish[] {
  // hotRecipesData 已经是 HotDish[] 数组
  return hotRecipesData.map(r => ({
    id: r.id,
    name: r.name,
    coverUrl: r.coverImage || '',
    category: r.category,
  }));
}

/**
 * 从完整菜谱数据中筛选热门菜品（基于本地热门菜库 ID）
 */
function selectHotRecipesFromData(recipes: Recipe[]): HotDish[] {
  const hotIds = new Set(hotRecipesData.map(r => r.id));
  const hotRecipes = recipes.filter(r => hotIds.has(String(r.id)));
  
  return hotRecipes.slice(0, HOT_RECIPES_PER_DAY).map(r => ({
    id: String(r.id),
    name: r.name,
    coverUrl: r.coverImage || '',
    category: (r.mealTimes && r.mealTimes[0]) || 'lunch',
  }));
}

/**
 * 获取当日热门菜品（从云数据库菜谱中按日期随机选取）
 */
function selectDailyHotRecipes(recipes: Recipe[], seed: number): HotDish[] {
  const random = seededRandom(seed);
  
  // 筛选有封面图的菜谱
  const recipesWithImages = recipes.filter(r => 
    r.coverImage && 
    !r.coverImage.includes('dummyimage.com') &&
    r.name
  );
  
  console.log('[首页] 有封面图的菜谱数量:', recipesWithImages.length);
  
  // 按日期打乱
  const shuffled = shuffleArray(recipesWithImages, random);
  
  // 取前24道（或全部如果有的话）
  const count = Math.min(HOT_RECIPES_PER_DAY, shuffled.length);
  return shuffled.slice(0, count).map(r => ({
    id: String(r.id),
    name: r.name,
    coverUrl: r.coverImage || '',
    category: (r.mealTimes && r.mealTimes[0]) || 'lunch',
  }));
}

Page({
  data: {
    hotDishes: [] as HotDish[],
    dailyDate: '', // 记录当前显示的日期，用于检测日期变更
    isLoading: false,
    displayedCount: INITIAL_COUNT, // 当前已展示数量
    hasMore: true,                // 是否还有更多可加载
    allHotDishes: [] as HotDish[], // 全部热门菜（懒加载时不重新请求）
    loadingMore: false,           // 是否正在加载更多（用于显示加载动画）
  },

  onShow() {
    try {
      const tab = typeof this.getTabBar === 'function' && this.getTabBar();
      if (tab) {
        tab.setData({ selected: 0 });
      }
    } catch (_e) {
      // 自定义 tabBar 未就绪时避免抛错导致整页不渲染
    }

    // 检查是否需要重新加载（日期变更或首次加载）
    const today = this._getTodayString();
    if (this.data.hotDishes.length === 0 || this.data.dailyDate !== today) {
      this._loadDailyHot();
    }
  },

  _getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  },

  _loadDailyHot() {
    const today = new Date();
    const seed = dateToSeed(today);
    const todayStr = this._getTodayString();

    console.log('[首页] _loadDailyHot 开始, today:', todayStr);

    // 本地热门菜库已有完整图片，立即显示
    const localHot = getLocalHotRecipes();
    if (localHot && localHot.length > 0) {
      console.log('[首页] 使用本地热门菜库，立即显示');
      this._updateHotDishesFromLocal(localHot, todayStr);
    }
  },

  // 从本地热门菜库更新热门菜品数据
  _updateHotDishesFromLocal(localHot: HotDish[], todayStr: string) {
    const dailyHot = shuffleArray(localHot, seededRandom(dateToSeed(new Date())));
    const displayed = dailyHot.slice(0, INITIAL_COUNT);
    const hasMore = dailyHot.length > INITIAL_COUNT;

    console.log('[首页] 更新热门菜品, hotDishes:', dailyHot.length, 'displayed:', displayed.length);

    this.setData({
      hotDishes: displayed,
      allHotDishes: dailyHot,
      dailyDate: todayStr,
      isLoading: false,
      displayedCount: INITIAL_COUNT,
      hasMore,
    });

    // 设置 IntersectionObserver
    setTimeout(() => {
      this._setupIntersectionObserver();
    }, 300);
  },

  onGoToSearch() {
    wx.navigateTo({ url: '/pages/search/index?focus=1' });
  },

  onGoToScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  },

  onGoToIngredients() {
    wx.navigateTo({ url: '/pages/ingredients/index' });
  },

  onGoToMore() {
    wx.navigateTo({ url: '/pages/recipes/list' });
  },

  // 设置 IntersectionObserver，监听"加载更多触发区"进入视口时自动追加数据
  _setupIntersectionObserver() {
    if (!this.data.hasMore) return;

    // 每次重新设置前先断开旧的
    if (_observer) {
      _observer.disconnect();
      _observer = null;
    }

    _observer = wx.createIntersectionObserver(this).relativeToViewport({
      bottom: 300 // 距底部 300px 时触发
    });

    _observer.observe('#load-more-trigger', (res: any) => {
      if (res.intersectionRatio > 0 && this.data.hasMore && !this.data.loadingMore) {
        this._loadMore();
      }
    });
  },

  // 加载更多数据
  _loadMore() {
    const { allHotDishes, displayedCount, hasMore } = this.data;
    if (!hasMore) return;

    this.setData({ loadingMore: true });

    // 模拟网络加载过程，300ms 后追加下一批
    setTimeout(() => {
      const nextCount = displayedCount + LOAD_COUNT;
      const newDisplayed = allHotDishes.slice(0, nextCount);
      const stillHasMore = allHotDishes.length > nextCount;

      this.setData({
        hotDishes: newDisplayed,
        displayedCount: nextCount,
        hasMore: stillHasMore,
        loadingMore: false,
      });
    }, 300);
  },

  onQuickRecipes(e: WechatMiniprogram.BaseEvent) {
    const presetMeal = e.currentTarget.dataset.presetMeal as string | undefined;
    const presetDish = e.currentTarget.dataset.presetDish as string | undefined;
    const qs: string[] = [];
    if (presetMeal) qs.push('presetMeal=' + encodeURIComponent(presetMeal));
    if (presetDish) qs.push('presetDish=' + encodeURIComponent(presetDish));
    const q = qs.length ? '?' + qs.join('&') : '';
    wx.navigateTo({ url: '/pages/recipes/list' + q });
  },

  onTapHotDish(e: WechatMiniprogram.BaseEvent) {
    const id = (e.currentTarget.dataset.id as string) || '';
    const name = (e.currentTarget.dataset.name as string) || '';

    // 直接用 id 跳转详情页（hotRecipes.json 已包含完整 id）
    if (id) {
      wx.navigateTo({
        url: `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=list`
      });
      return;
    }

    // 兜底：如果没有 id，通过 name 加载本地 recipes.json 查找 id
    if (!name.trim()) return;

    let matchedId = '';
    const recipes = loadRecipesJson();
    const found = recipes.find((r) => String(r.name || '').trim() === name.trim());
    if (found && found.id) matchedId = String(found.id);

    if (!matchedId) {
      wx.showToast({ title: '未找到该菜谱', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/recipes/detail?id=${encodeURIComponent(matchedId)}&from=list`
    });
  },
});
