/**
 * 首页热门菜品数据
 * 基于日期轮换，每天展示不同的热门菜品
 */
import { loadRecipesJson, loadHotRecipesJson } from '../../utils/dataLoader';

interface HotRecipe {
  id: string;
  name: string;
  category: string;
}

interface HotDish {
  id: string;
  name: string;
  coverUrl: string;
  category: string;
}

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
 * 获取当日热门菜品
 * @param hotRecipes 热门菜库
 * @returns 当日选中的24道热门菜
 */
function getDailyHotRecipes(hotRecipes: HotRecipe[]): HotRecipe[] {
  const today = new Date();
  const seed = dateToSeed(today);
  const random = seededRandom(seed);
  const shuffled = shuffleArray(hotRecipes, random);
  return shuffled.slice(0, HOT_RECIPES_PER_DAY);
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
    this.setData({ isLoading: true });

    setTimeout(() => {
      // 1. 从 recipes.json 构建 id -> recipe 映射（用于获取封面图）
      const recipes = loadRecipesJson() as any[];
      const recipeMap: Record<string, any> = {};
      if (Array.isArray(recipes)) {
        for (const r of recipes) {
          if (r && r.id && r.name) {
            recipeMap[String(r.id)] = r;
          }
        }
      }

      // 2. 加载热门菜库（使用 dataLoader 中已导出的函数）
      const hotRaw = loadHotRecipesJson() as any;
      const hotRecipes: HotRecipe[] = (hotRaw && hotRaw.hotRecipes) || [];

      // 3. 根据日期选择当日菜品
      const dailyRecipes = getDailyHotRecipes(hotRecipes);

      // 4. 匹配封面图
      const enriched = dailyRecipes.map(dish => {
        const recipe = recipeMap[dish.id];
        return {
          id: dish.id,
          name: dish.name,
          coverUrl: (recipe ? recipe.coverImage : '') || '',
          category: dish.category,
        };
      }).filter(d => d.coverUrl && !d.coverUrl.includes('dummyimage.com')); // 只保留有真实图片的

      // 如果过滤后不足6道，补齐
      let filteredEnriched = enriched;
      if (enriched.length < HOT_RECIPES_PER_DAY) {
        const allWithImages = Object.values(recipeMap)
          .filter((r: any) => r.coverImage && !r.coverImage.includes('dummyimage.com'))
          .map((r: any) => ({
            id: String(r.id),
            name: r.name,
            coverUrl: r.coverImage,
            category: (r.mealTimes || [])[0] || 'lunch',
          }));

        const usedIds = new Set(enriched.map(e => e.id));
        const today = new Date();
        const seed = dateToSeed(today) + 1; // 不同种子确保补齐的菜品不同
        const random = seededRandom(seed);
        const shuffled = shuffleArray(
          allWithImages.filter(r => !usedIds.has(r.id)),
          random
        );

        while (enriched.length < HOT_RECIPES_PER_DAY && shuffled.length > 0) {
          enriched.push(shuffled.shift()!);
        }
      }

      // 5. 取首次展示数量
      const displayed = enriched.slice(0, INITIAL_COUNT);
      const hasMore = enriched.length > INITIAL_COUNT;

      this.setData({
        hotDishes: displayed,
        allHotDishes: enriched,
        dailyDate: this._getTodayString(),
        isLoading: false,
        displayedCount: INITIAL_COUNT,
        hasMore,
      });

      // 6. 数据加载完成后，延迟设置 IntersectionObserver（等 DOM 渲染完毕）
      setTimeout(() => {
        this._setupIntersectionObserver();
      }, 500);
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
    const name = (e.currentTarget.dataset.name as string) || '';
    const id = (e.currentTarget.dataset.id as string) || '';

    if (id) {
      wx.navigateTo({
        url: `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=list`
      });
      return;
    }

    if (!name.trim()) return;

    // 兜底：通过名字匹配菜谱 id
    let matchedId = '';
    try {
      const rawList = loadRecipesJson();
      if (rawList && Array.isArray(rawList)) {
        const found = rawList.find(
          (r: any) => (r.name as string) === name.trim()
        );
        if (found && found.id) matchedId = String(found.id);
      }
    } catch (_e) {}

    if (!matchedId) {
      wx.showToast({ title: '未找到该菜谱', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/recipes/detail?id=${encodeURIComponent(matchedId)}&from=list`
    });
  },
});
