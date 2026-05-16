// 食材识别模块 - 优化版
// 使用豆包+DeepSeek双模型，只识别蔬菜、肉类、海鲜、调料等食材
// 食材白名单从 ingredients.json 动态加载，与食材库完全一致

// ============ API 配置 ============
const DOUBAO_API_KEY = 'e01eb0d1-7d88-4df5-b1d7-03a7c128ebba';
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_MODEL = 'doubao-seed-2-0-pro-260215';

const DEEPSEEK_API_KEY = 'sk-981eee9e36c04a8f8470a7fc9fa8aa93';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export interface IngredientRecognitionResult {
  name: string
  confidence: number
  source: 'doubao' | 'llm'
}

// ============ 动态食材白名单（从 ingredients.json 加载）============
// 启动时一次性加载，所有识别/过滤都基于此
let _foodKeywords: Set<string> | null = null;
let _allIngredientNames: string[] | null = null;
let _ingredientMap: Map<string, string> | null = null; // 识别名 → 标准名

function ensureFoodKeywords(): void {
  if (_foodKeywords) return;

  let names: string[] = [];
  try {
    // 尝试从 dataLoader 获取
    const dataLoader = require('./dataLoader');
    const arr = dataLoader.loadIngredientsJson() as Array<{ name: string }>;
    names = arr.map(item => item.name).filter(Boolean);
    } catch (e) {
      // fallback: 直接读取文件
      try {
        const fs = wx.getFileSystemManager();
        const content = fs.readFileSync('miniprogram/data/ingredients.json', 'utf-8') as any;
        const arr = JSON.parse(content) as Array<{ name: string }>;
        names = arr.map(item => item.name).filter(Boolean);
      } catch (e) {
        console.error(`[${getTimestamp()}] [AIphoto] 加载食材库失败`, e);
        names = [];
      }
  }

  _allIngredientNames = names;
  _foodKeywords = new Set(names);

  // 构建识别名 → 标准名映射（食材库已有名称为标准名）
  _ingredientMap = new Map();
  for (const name of names) {
    _ingredientMap!.set(name, name);
  }

  // AI 常见识别变体 → 食材库标准名（只有库中存在的才映射）
  // 规则：变体名称 → 标准名称（标准名必须在食材库中）
  const knownAliases: Array<[string, string]> = [
    ['西红柿', '番茄'],
    ['小番茄', '圣女果'],
    ['圣女果', '圣女果'],
    ['大蒜', '蒜瓣'],
    ['蒜头', '蒜瓣'],
    ['芫荽', '香菜'],
    ['青瓜', '黄瓜'],
    ['红萝卜', '胡萝卜'],
    ['白菜', '大白菜'],
    ['圆白菜', '包菜'],
    ['甘蓝', '包菜'],
    ['猪里脊', '猪里脊'],
    ['牛里脊', '猪里脊'],
    ['里脊', '猪里脊'],
    ['嫩豆腐', '豆腐'],
    ['老豆腐', '豆腐'],
    ['生姜', '姜'],
    ['葱', '大葱'],
    ['小葱', '大葱'],
    ['鲜奶', '牛奶'],
    ['牛奶', '牛奶'],
    ['干辣椒', '干辣椒'],
    ['辣椒粉', '辣椒粉'],
    ['青椒', '青椒'],
    ['红椒', '红椒'],
    ['彩椒', '彩椒'],
    ['小米辣', '小米辣'],
    ['杭椒', '杭椒'],
    ['线椒', '线椒'],
    ['尖椒', '尖椒'],
    ['灯笼椒', '灯笼椒'],
    ['螺丝椒', '螺丝椒'],
    ['余干椒', '余干椒'],
    // 肉糜/肉末类 → 猪肉（AI 最常见识别）
    ['肉末', '猪肉'],
    ['绞肉', '猪肉'],
    ['肉糜', '猪肉'],
    ['猪肉末', '猪肉'],
    ['猪肉馅', '猪肉'],
    ['猪肉碎', '猪肉'],
    ['肉馅', '猪肉'],
    // 牛肉糜类
    ['牛肉末', '牛肉'],
    ['牛肉糜', '牛肉'],
    ['牛肉馅', '牛肉'],
    ['牛肉碎', '牛肉'],
    ['牛绞肉', '牛肉'],
    // 鸡肉类
    ['鸡肉末', '鸡肉'],
    ['鸡肉糜', '鸡肉'],
    ['鸡胸肉', '鸡胸肉'],
    ['鸡柳', '鸡胸肉'],
    ['鸡蛋黄', '鸡蛋'],
    ['蛋白', '鸡蛋'],
    ['鸡蛋液', '鸡蛋'],
    // 鱼类具体品种（直接映射到食材库标准名）
    ['三文鱼', '三文鱼'],
    ['三文', '三文鱼'],
    ['鲈鱼', '鲈鱼'],
    ['鲈板', '鲈鱼'],
    ['金枪鱼', '金枪鱼'],
    ['吞拿鱼', '金枪鱼'],
    ['鳕鱼', '鳕鱼'],
    ['银鳕鱼', '鳕鱼'],
    ['龙利鱼', '龙利鱼'],
    ['龙利', '龙利鱼'],
    ['巴沙鱼', '巴沙鱼'],
    ['巴沙', '巴沙鱼'],
    ['带鱼', '带鱼'],
    ['黄鱼', '黄花鱼'],
    ['黄花鱼', '黄花鱼'],
    ['草鱼', '草鱼'],
    ['青鱼', '草鱼'],
    ['鲤鱼', '鲤鱼'],
    ['鲫鱼', '鲫鱼'],
    ['鲫鱼', '鲫鱼'],
    ['鳜鱼', '鳜鱼'],
    ['桂鱼', '鳜鱼'],
    ['多宝鱼', '多宝鱼'],
    ['秋刀鱼', '秋刀鱼'],
    ['银鱼', '银鱼'],
    ['小银鱼', '小银鱼'],
    ['鳝鱼', '鳝鱼'],
    ['黄鳝', '鳝鱼'],
    ['多春鱼', '多春鱼'],
    ['小河鱼', '小河鱼'],
    ['河鱼', '草鱼'],
    ['海鱼', '带鱼'],
    ['鲜鱼', '草鱼'],
    ['活鱼', '草鱼'],
    ['整鱼', '草鱼'],
    ['鱼身', '草鱼'],
    ['鲜活的鱼', '草鱼'],
    // 鱼类加工制品（食材库已有）
    ['鱼片', '鱼片'],
    ['鱼丸', '鱼丸'],
    ['鱼籽', '鱼籽'],
    ['鱼头', '鱼头'],
    ['鱼胶', '鱼胶'],
    ['鱼翅', '鱼翅'],
    ['鱼子酱', '鱼子酱'],
  ];

  for (const [alias, standard] of knownAliases) {
    // 确保标准名在食材库中才建立映射
    if (_foodKeywords!.has(standard)) {
      _ingredientMap!.set(alias, standard);
    }
  }

  console.log(`[${getTimestamp()}] [AIphoto] 加载食材库，共 ${names.length} 种食材，映射 ${_ingredientMap!.size} 个名称`);
}

function getFoodKeywords(): Set<string> {
  ensureFoodKeywords();
  return _foodKeywords!;
}

function getAllIngredientNames(): string[] {
  ensureFoodKeywords();
  return _allIngredientNames!;
}

function mapToStandard(name: string): string {
  ensureFoodKeywords();
  const trimmed = name.trim();

  // 1. 精确匹配 map（最优先）
  const exact = _ingredientMap!.get(trimmed);
  if (exact) return exact;

  // 2. 加工形态模糊匹配：*末/糜/馅/碎 → 映射到肉类
  // 只对包含这些后缀的变体做模糊替换
  const meatMorphPatterns: Array<[RegExp, string]> = [
    [/(?:猪)?肉(?:末|糜|馅|碎)$/, '猪肉'],
    [/(?:牛)?肉(?:末|糜|馅|碎)$/, '牛肉'],
    [/(?:羊)?肉(?:末|糜|馅|碎)$/, '羊肉'],
    [/(?:鸡)?肉(?:末|糜|馅|碎)$/, '鸡肉'],
    // 鱼肉形态：由于"鱼肉"已从食材库删除，改映射到常见鱼种草鱼
    [/鱼(?:肉(?:末|糜|馅|碎)|段|块|片)$/, '草鱼'],
    [/(?:虾)?肉(?:末|糜|馅|碎)$/, '虾'],
  ];
  for (const [pattern, standard] of meatMorphPatterns) {
    if (pattern.test(trimmed)) {
      // 确认目标在食材库中
      if (_foodKeywords!.has(standard)) {
        return standard;
      }
    }
  }

  // 3. 其他情况不模糊匹配，返回原名（后续 filterAndNormalize 会过滤掉不在库中的）
  return trimmed;
}

// ============ 非食材黑名单 ============
const NON_FOOD_BLACKLIST = new Set([
  '手机', '电脑', '电视', '冰箱', '洗衣机', '空调', '微波炉', '电磁炉', '电饭煲', '电水壶', '电吹风', '吸尘器', '电风扇', '打印机', '路由器', '充电器', '充电宝', '耳机', '音响', '音箱',
  '桌子', '椅子', '沙发', '床', '柜子', '书架', '茶几', '凳子', '床垫', '枕头', '被子',
  '碗', '盘子', '杯子', '筷子', '勺子', '叉子', '刀', '砧板',
  '人', '人物', '动物', '猫', '狗', '车', '衣服', '鞋子', '包包', '书本', '笔', '纸', '钱', '手机壳', '钥匙', '眼镜', '手表', '首饰', '化妆品', '护肤品', '洗发水', '沐浴露', '香皂', '毛巾', '扫帚', '拖把', '垃圾桶', '垃圾袋', '塑料袋', '纸杯', '塑料杯', '玻璃杯',
]);

// ============ 图像识别 API ============

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timePart = now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${timePart}`;
}

function logWithTimestamp(message: string): void {
  console.log(`[${getTimestamp()}] ${message}`);
}

function readImageAsBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: (res: any) => resolve(res.data),
      fail: (err) => {
        console.error(`[${getTimestamp()}] 读取图片失败`, err);
        reject(err);
      }
    });
  });
}

async function recognizeWithDoubao(imagePath: string): Promise<IngredientRecognitionResult[]> {
  logWithTimestamp('开始豆包图像识别...');
  ensureFoodKeywords();

  const imageBase64 = await readImageAsBase64(imagePath);
  const ingredientNames = getAllIngredientNames();

  // 动态生成提示词，把食材库所有名称注入给 AI
  const ingredientList = ingredientNames.join('、');

  const prompt = `你是专业的食材识别AI。请仔细分析这张图片，**逐一识别图片中所有可见的食材**，不要遗漏任何一种。

## 食材库（必须严格使用以下标准名称，禁止自行发明名称）：
${ingredientList}

## 识别规则：
1. **必须输出图片中所有可见的食材**，不要故意遗漏，即使超过12种也要全部列出
2. **只输出食材库中存在的名称**。如果识别到的食材在库中没有完全匹配的，可以用最接近的库中食材名称。
3. **识别变体时要映射到标准名**，例如：
   - "西红柿" → "番茄"
   - "大蒜"、"蒜头" → "蒜瓣"
   - "猪肉末"、"绞肉"、"肉糜" → "猪肉"
4. **🐟 鱼类识别规则**：必须识别出具体品种（如三文鱼、鲈鱼、鳕鱼等），禁止返回通用名称"鱼"
5. **必须过滤掉非食材**：手机、电脑、餐具、衣服、人、动物等

## 输出要求：
1. 输出图片中所有可见的食材（不要限制数量）
2. 每种食材输出置信度（0-1之间）
3. 使用简体中文标准名称
4. 如果图片中没有食材，返回空数组 []

请以JSON数组格式输出：
[{"name":"标准食材名称","confidence":0.95}, ...]

只输出JSON，不要其他文字说明。`;

  return new Promise((resolve) => {
    wx.request({
      url: DOUBAO_API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      data: {
        model: DOUBAO_MODEL,
        reasoning_effort: "minimal",
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: 'text', text: prompt }
            ]
          }
        ]
      },
      success: (res: any) => {
        logWithTimestamp('豆包 API 响应: ' + JSON.stringify(res.data));

        if (res.data && res.data.error) {
          console.error(`[${getTimestamp()}] 豆包 API 错误:`, res.data.error);
          resolve([]);
          return;
        }

        try {
          const choices = res.data.choices || [];
          let content = '';
          for (const choice of choices) {
            if (choice && choice.message && choice.message.content) {
              content = choice.message.content;
              break;
            }
          }
          console.log(`[${getTimestamp()}] 豆包识别内容:`, content);

          let jsonStr = content.trim();
          const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (jsonMatch) jsonStr = jsonMatch[0];

          let results: IngredientRecognitionResult[] = JSON.parse(jsonStr).map((item: any) => ({
            name: item.name,
            confidence: item.confidence,
            source: 'doubao' as const
          }));

          // 本地二次过滤 + 标准化
          results = filterAndNormalize(results);

          console.log(`[${getTimestamp()}] 过滤后识别结果:`, results);
          resolve(results);
        } catch (parseError) {
          console.error(`[${getTimestamp()}] 解析豆包结果失败:`, parseError);
          resolve([]);
        }
      },
      fail: (err) => {
        console.error(`[${getTimestamp()}] 请求豆包失败:`, err);
        resolve([]);
      }
    });
  });
}

// ============ 结果过滤 + 标准化函数 ============

function filterAndNormalize(results: IngredientRecognitionResult[]): IngredientRecognitionResult[] {
  ensureFoodKeywords();
  const foodSet = getFoodKeywords();

  return results.filter(item => {
    const name = item.name.trim();

    // 1. 黑名单过滤
    if (NON_FOOD_BLACKLIST.has(name)) {
      console.log(`[${getTimestamp()}] 过滤黑名单: ${name}`);
      return false;
    }
    for (const black of NON_FOOD_BLACKLIST) {
      if (name.includes(black) || black.includes(name)) {
        console.log(`[${getTimestamp()}] 过滤黑名单关键词: ${name}`);
        return false;
      }
    }

    // 2. 映射到标准名称
    const standardName = mapToStandard(name);
    item.name = standardName;

    // 3. 置信度检查
    if (item.confidence < 0.25) {
      console.log(`[${getTimestamp()}] 过滤低置信度: ${name} (${item.confidence})`);
      return false;
    }

    return true;
  });
}

// ============ DeepSeek 标准化（备用兜底）============

async function normalizeWithDeepSeek(
  doubaoResults: IngredientRecognitionResult[]
): Promise<IngredientRecognitionResult[]> {
  if (doubaoResults.length === 0) return [];

  ensureFoodKeywords();
  const ingredientNames = getAllIngredientNames();
  const doubaoNames = doubaoResults.map(r => ({ name: r.name, confidence: r.confidence }));

  console.log(`[${getTimestamp()}] 调用 DeepSeek 标准化结果:`, doubaoNames);

  const prompt = `你是一个专业的食材识别标准化AI。

## 食材库（必须严格使用以下标准名称）：
${ingredientNames.join('、')}

## 任务：
1. 将识别结果标准化为食材库中的标准名称
2. 过滤掉非食材
3. 返回标准化的JSON数组

## 标准化规则：
- "猪肉末"、"肉末"、"绞肉"、"肉糜"、"猪肉馅" → "猪肉"
- "牛肉末"、"牛肉糜"、"牛肉馅" → "牛肉"
- "西红柿" → "番茄"
- "蒜头"、"大蒜" → "蒜瓣"
- "里脊肉"、"外脊" → "里脊"
- "牛腱" → "牛腱子"

## 必须过滤（非食材）：
手机、电脑、电视、家具、餐具、人、动物、衣服、鞋子等。

## 只返回JSON数组：
[{"name":"标准食材名称","confidence":0.9}, ...]

输入：
${doubaoNames.map(n => `- ${n.name} (置信度: ${n.confidence})`).join('\n')}

只输出JSON数组，不要其他文字。`;

  return new Promise((resolve) => {
    wx.request({
      url: DEEPSEEK_API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      data: {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      },
      success: async (res: any) => {
        console.log(`[${getTimestamp()}] DeepSeek 响应:`, JSON.stringify(res.data));

        if (res.statusCode && res.statusCode >= 400) {
          console.error(`[${getTimestamp()}] DeepSeek HTTP 错误:`, res.statusCode, res.data);
          resolve(doubaoResults);
          return;
        }

        if (res.data && res.data.error) {
          console.error(`[${getTimestamp()}] DeepSeek API 错误:`, res.data.error);
          resolve(doubaoResults);
          return;
        }

        try {
          let content = '';
          if (res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message && res.data.choices[0].message.content) {
            content = res.data.choices[0].message.content;
          }
          console.log(`[${getTimestamp()}] DeepSeek 标准化结果:`, content);

          let jsonStr = content.trim();
          let jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (jsonMatch) jsonStr = jsonMatch[0];

          let normalizedResults: IngredientRecognitionResult[] = JSON.parse(jsonStr);
          console.log(`[${getTimestamp()}] DeepSeek 解析结果:`, normalizedResults);

          // 过滤 + 标准化
          normalizedResults = filterAndNormalize(normalizedResults.map((item: any) => ({
            name: item.name,
            confidence: item.confidence || item.confidence_score || 0.8,
            source: 'llm' as const
          })));

          resolve(normalizedResults);
        } catch (parseError) {
          console.error(`[${getTimestamp()}] 解析 DeepSeek 结果失败:`, parseError);
          resolve(doubaoResults);
        }
      },
      fail: (err) => {
        console.error(`[${getTimestamp()}] 请求 DeepSeek 失败:`, err);
        resolve(doubaoResults);
      }
    });
  });
}

// ============ 主入口 ============

export async function recognizeIngredients(imagePath: string): Promise<IngredientRecognitionResult[]> {
  try {
    wx.showLoading({ title: '识别中...' });
    console.log(`[${getTimestamp()}] 开始识别图片:`, imagePath);

    const doubaoResults = await recognizeWithDoubao(imagePath);
    console.log(`[${getTimestamp()}] 豆包识别结果:`, doubaoResults);

    if (doubaoResults.length === 0) {
      wx.hideLoading();
      return [];
    }

    const normalizedResults = await normalizeWithDeepSeek(doubaoResults);
    console.log(`[${getTimestamp()}] 最终识别结果:`, normalizedResults);

    wx.hideLoading();
    return normalizedResults;

  } catch (error) {
    console.error(`[${getTimestamp()}] 识别失败`, error);
    wx.hideLoading();
    wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    return [];
  }
}

export async function recognizeImage(imagePath: string): Promise<IngredientRecognitionResult[]> {
  return await recognizeIngredients(imagePath);
}
