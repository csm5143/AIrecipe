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

// 热门菜谱数据（从 hotRecipes.json 内嵌，共80道菜品）
const HOT_RECIPES_DATA: HotRecipesRaw = {
  "lastUpdated": "2026-04-11",
  "description": "首页热门菜库，包含80道精选热门菜品，每天按日期轮换展示24道",
  "hotRecipes": [
    { "id": "34", "name": "皮蛋瘦肉粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/皮蛋瘦肉粥.png", "category": "breakfast" },
    { "id": "18", "name": "鸡蛋饼", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鸡蛋饼.png", "category": "breakfast" },
    { "id": "76", "name": "红枣枸杞小米粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红枣枸杞小米粥.png", "category": "breakfast" },
    { "id": "379", "name": "八宝粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/八宝粥.png", "category": "breakfast" },
    { "id": "581", "name": "燕麦粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/燕麦粥.png", "category": "breakfast" },
    { "id": "479", "name": "南瓜小米粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/南瓜小米粥.png", "category": "breakfast" },
    { "id": "416", "name": "红豆枸杞小米粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红豆枸杞小米粥.png", "category": "breakfast" },
    { "id": "398", "name": "豆腐蒸蛋", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/豆腐蒸蛋.png", "category": "breakfast" },
    { "id": "515", "name": "全麦三明治", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/全麦三明治.png", "category": "breakfast" },
    { "id": "6", "name": "西红柿炒鸡蛋", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/西红柿炒鸡蛋.png", "category": "breakfast" },
    { "id": "516", "name": "全麦吐司", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/全麦吐司.png", "category": "breakfast" },
    { "id": "384", "name": "包子", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/包子.png", "category": "breakfast" },
    { "id": "420", "name": "红枣枸杞豆浆", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红枣枸杞豆浆.png", "category": "breakfast" },
    { "id": "555", "name": "五谷豆浆", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/五谷豆浆.png", "category": "breakfast" },
    { "id": "141", "name": "蛋挞", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/蛋挞.png", "category": "breakfast" },
    { "id": "570", "name": "香菇瘦肉粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/香菇瘦肉粥.png", "category": "breakfast" },
    { "id": "418", "name": "红豆薏米粥", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红豆薏米粥.png", "category": "breakfast" },
    { "id": "2", "name": "番茄鸡蛋面", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/番茄鸡蛋面.png", "category": "lunch" },
    { "id": "331", "name": "鱼汤面", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鱼汤面.png", "category": "lunch" },
    { "id": "333", "name": "牛肉面", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/牛肉面.png", "category": "lunch" },
    { "id": "17", "name": "番茄牛腩面", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/番茄牛腩面.png", "category": "lunch" },
    { "id": "438", "name": "菌菇豆腐煲", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/菌菇豆腐煲.png", "category": "lunch" },
    { "id": "439", "name": "咖喱鸡丁饭", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/咖喱鸡丁饭.png", "category": "lunch" },
    { "id": "171", "name": "地三鲜", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/地三鲜.png", "category": "lunch" },
    { "id": "178", "name": "干煸四季豆", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/干煸四季豆.png", "category": "lunch" },
    { "id": "201", "name": "番茄金针菇豆腐汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/番茄金针菇豆腐汤.png", "category": "lunch" },
    { "id": "437", "name": "京酱肉丝", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/京酱肉丝.png", "category": "lunch" },
    { "id": "5", "name": "鸡蛋炒饭", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鸡蛋炒饭.png", "category": "lunch" },
    { "id": "276", "name": "蛋炒饭", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/蛋炒饭.png", "category": "lunch" },
    { "id": "430", "name": "鲫鱼豆腐汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鲫鱼豆腐汤.png", "category": "lunch" },
    { "id": "65", "name": "海带排骨汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/海带排骨汤.png", "category": "lunch" },
    { "id": "224", "name": "冬瓜排骨汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/冬瓜排骨汤.png", "category": "lunch" },
    { "id": "15", "name": "酸辣土豆丝", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/酸辣土豆丝.png", "category": "lunch" },
    { "id": "4", "name": "青椒土豆丝", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/青椒土豆丝.png", "category": "lunch" },
    { "id": "308", "name": "青椒肉丝", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/青椒肉丝.png", "category": "lunch" },
    { "id": "300", "name": "宫保鸡丁", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/宫保鸡丁.png", "category": "lunch" },
    { "id": "389", "name": "彩蔬鸡丁饭", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/彩蔬鸡丁饭.png", "category": "lunch" },
    { "id": "22", "name": "麻婆豆腐", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/麻婆豆腐.png", "category": "dinner" },
    { "id": "535", "name": "酸菜鱼", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/酸菜鱼.png", "category": "dinner" },
    { "id": "533", "name": "松鼠鳜鱼", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/松鼠鳜鱼.png", "category": "dinner" },
    { "id": "60", "name": "清蒸鲈鱼", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/清蒸鲈鱼.png", "category": "dinner" },
    { "id": "8", "name": "红烧肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红烧肉.png", "category": "dinner" },
    { "id": "13", "name": "土豆炖牛肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/土豆炖牛肉.png", "category": "dinner" },
    { "id": "294", "name": "水煮牛肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/水煮牛肉.png", "category": "dinner" },
    { "id": "182", "name": "回锅肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/回锅肉.png", "category": "dinner" },
    { "id": "3", "name": "可乐鸡翅", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/可乐鸡翅.png", "category": "dinner" },
    { "id": "545", "name": "糖醋里脊", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/糖醋里脊.png", "category": "dinner" },
    { "id": "7", "name": "糖醋排骨", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/糖醋排骨.png", "category": "dinner" },
    { "id": "10", "name": "鱼香肉丝", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鱼香肉丝.png", "category": "dinner" },
    { "id": "12", "name": "红烧排骨", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红烧排骨.png", "category": "dinner" },
    { "id": "20", "name": "红烧茄子", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/红烧茄子.png", "category": "dinner" },
    { "id": "382", "name": "白灼虾", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/白灼虾.png", "category": "dinner" },
    { "id": "46", "name": "椒盐虾", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/椒盐虾.png", "category": "dinner" },
    { "id": "580", "name": "香辣蟹", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/香辣蟹.png", "category": "dinner" },
    { "id": "301", "name": "辣子鸡丁", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/辣子鸡丁.png", "category": "dinner" },
    { "id": "165", "name": "手撕包菜", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/手撕包菜.png", "category": "dinner" },
    { "id": "164", "name": "辣椒炒肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/辣椒炒肉.png", "category": "dinner" },
    { "id": "343", "name": "小炒牛肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/小炒牛肉.png", "category": "dinner" },
    { "id": "370", "name": "爆炒羊肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/爆炒羊肉.png", "category": "dinner" },
    { "id": "365", "name": "香煎牛排", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/香煎牛排.png", "category": "dinner" },
    { "id": "471", "name": "迷迭香烤牛排", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/迷迭香烤牛排.png", "category": "dinner" },
    { "id": "574", "name": "香煎牛排配芦笋", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/香煎牛排配芦笋.png", "category": "dinner" },
    { "id": "220", "name": "白萝卜炖排骨", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/白萝卜炖排骨.png", "category": "dinner" },
    { "id": "298", "name": "芹菜炒牛肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/芹菜炒牛肉.png", "category": "dinner" },
    { "id": "521", "name": "沙茶牛肉", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/沙茶牛肉.png", "category": "dinner" },
    { "id": "485", "name": "牛骨白萝卜汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/牛骨白萝卜汤.png", "category": "dinner" },
    { "id": "167", "name": "鱼香茄子", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鱼香茄子.png", "category": "dinner" },
    { "id": "221", "name": "清炒白菜", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/清炒白菜.png", "category": "dinner" },
    { "id": "66", "name": "韭菜炒鸡蛋", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/韭菜炒鸡蛋.png", "category": "dinner" },
    { "id": "223", "name": "清炒油麦菜", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/清炒油麦菜.png", "category": "dinner" },
    { "id": "19", "name": "紫菜豆腐汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/紫菜豆腐汤.png", "category": "dinner" },
    { "id": "585", "name": "鱼头汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/鱼头汤.png", "category": "dinner" },
    { "id": "226", "name": "冬瓜老鸭汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/冬瓜老鸭汤.png", "category": "dinner" },
    { "id": "392", "name": "虫草花胶鸡汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/虫草花胶鸡汤.png", "category": "dinner" },
    { "id": "426", "name": "花胶鸡汤", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/花胶鸡汤.png", "category": "dinner" },
    { "id": "469", "name": "毛血旺", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/毛血旺.png", "category": "dinner" },
    { "id": "408", "name": "干锅牛蛙", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/干锅牛蛙.png", "category": "dinner" },
    { "id": "523", "name": "烧鹅", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/烧鹅.png", "category": "dinner" },
    { "id": "115", "name": "佛跳墙", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/佛跳墙.png", "category": "dinner" },
    { "id": "109", "name": "烤羊排", "coverUrl": "https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/所有菜品/烤羊排.png", "category": "dinner" }
  ]
};

/**
 * 加载本地热门菜谱数据
 */
function loadHotRecipesData(): HotDish[] {
  console.log('[index] 加载热门菜谱数据，数量:', HOT_RECIPES_DATA.hotRecipes.length);
  return HOT_RECIPES_DATA.hotRecipes;
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
  return hotRecipesData.map(r => ({
    id: String(r.id),
    name: r.name,
    coverUrl: r.coverUrl || r.coverImage || '',
    category: r.category || 'lunch',
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

    // 本地热门菜库已有完整图片，立即显示
    const localHot = getLocalHotRecipes();
    if (localHot && localHot.length > 0) {
      this._updateHotDishesFromLocal(localHot, todayStr);
    }
  },

  // 从本地热门菜库更新热门菜品数据
  _updateHotDishesFromLocal(localHot: HotDish[], todayStr: string) {
    const dailyHot = shuffleArray(localHot, seededRandom(dateToSeed(new Date())));
    const displayed = dailyHot.slice(0, INITIAL_COUNT);
    const hasMore = dailyHot.length > INITIAL_COUNT;

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
