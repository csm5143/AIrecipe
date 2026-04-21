import { Recipe } from '../types/index';

/**
 * 当 JSON 菜谱数据加载失败或为空时使用的兜底示例菜谱列表
 * 仅用于防止页面完全空白，方便体验和调试
 */
export function getFallbackRecipes(): Recipe[] {
  return [
    {
      id: '1',
      name: '蒜香西兰花炒鸡胸',
      coverImage: '/assets/蒜香西蓝花炒鸡胸.png',
      description:
        '西兰花爽脆、鸡胸肉低脂，用最家常的蒜香快炒，十几分钟就能搞定的一道减脂快手菜。',
      ingredients: ['鸡胸肉', '西兰花', '蒜瓣', '盐', '酱油'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 20,
      difficulty: 'easy'
    },
    {
      id: '2',
      name: '番茄鸡蛋面',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%95%AA%E8%8C%84%E9%B8%A1%E8%9B%8B%E9%9D%A2',
      description:
        '西红柿和鸡蛋的经典搭配，加上顺口的热面，一碗就能解决一顿的家常主食。',
      ingredients: ['番茄', '鸡蛋', '挂面', '盐'],
      mealTimes: ['breakfast', 'lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '3',
      name: '清蒸鱼片',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E6%B8%85%E8%92%B8%E9%B1%BC%E7%89%87',
      description:
        '家常版清蒸鱼片，少油更清爽，保持鱼肉嫩滑鲜甜，搭配一碗白米饭刚刚好。',
      ingredients: ['鱼片', '姜', '酱油', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 25,
      difficulty: 'normal'
    },
    {
      id: '4',
      name: '青椒土豆丝',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E9%9D%92%E6%A4%92%E5%9C%9F%E8%B1%86%E4%B8%9D',
      description:
        '酸爽开胃的家常小炒，土豆脆爽、青椒清香，是很多人下饭必点的一道家常菜。',
      ingredients: ['土豆', '青椒', '蒜瓣', '盐', '醋'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '5',
      name: '鸡蛋炒饭',
      coverImage:
        'https://dummyimage.com/600x400/facc15/000000&text=%E9%B8%A1%E8%9B%8B%E7%82%92%E9%A5%AD',
      description:
        '几乎家家都会做的入门级炒饭，把剩米饭和鸡蛋、蔬菜炒香，就是一锅香喷喷的快手晚餐。',
      ingredients: ['大米', '鸡蛋', '胡萝卜', '豌豆', '盐', '酱油'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 12,
      difficulty: 'easy'
    },
    {
      id: '6',
      name: '西红柿炒鸡蛋',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E8%A5%BF%E7%BA%A2%E6%9F%BF%E7%82%92%E9%B8%A1%E8%9B%8B',
      description: '国民级家常菜，酸甜适口，配一碗米饭可以多吃两碗。',
      ingredients: ['番茄', '鸡蛋', '葱花', '盐', '糖'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 10,
      difficulty: 'easy'
    },
    {
      id: '7',
      name: '紫菜蛋花汤',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E7%B4%AB%E8%8F%9C%E8%9B%8B%E8%8A%B1%E6%B1%A4',
      description: '三分钟一碗简单暖胃汤，紫菜和鸡蛋的组合非常百搭，适合任何一餐。',
      ingredients: ['紫菜', '鸡蛋', '葱花', '盐', '香油'],
      mealTimes: ['breakfast', 'lunch', 'dinner'],
      dishTypes: ['soup'],
      timeCost: 8,
      difficulty: 'easy'
    },
    {
      id: '8',
      name: '红烧肉',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%BA%A2%E7%83%A7%E8%82%89',
      description:
        '晶莹剔透的肥瘦相间，入口软糯香甜，是逢年过节和家常聚餐都常见的一道硬菜。',
      ingredients: ['五花肉', '姜', '蒜瓣', '酱油', '糖', '料酒'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 60,
      difficulty: 'normal'
    },
    {
      id: '9',
      name: '宫保鸡丁',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%AE%AB%E4%BF%9D%E9%B8%A1%E4%B8%81',
      description:
        '川菜馆必点之一，鸡丁外滑里嫩，花生米香脆，一碗米饭完全不够吃。',
      ingredients: ['鸡胸肉', '花生米', '干辣椒', '花椒', '蒜瓣', '酱油', '糖', '醋'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 30,
      difficulty: 'normal'
    },
    {
      id: '10',
      name: '鱼香肉丝',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%B1%BC%E9%A6%99%E8%82%89%E4%B8%9D',
      description:
        '下饭家常菜代表，酸甜带辣、开胃又下饭，几乎每家餐桌上都出现过。',
      ingredients: ['猪肉', '胡萝卜', '木耳', '青椒', '蒜瓣', '姜', '豆瓣酱', '糖', '醋'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 30,
      difficulty: 'normal'
    },
    {
      id: '11',
      name: '凉拌黄瓜',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E5%87%89%E6%8B%8C%E9%BB%84%E7%93%9C',
      description:
        '清爽又解腻的凉菜，用最简单的调料，敲几下就能做好的一盘小菜。',
      ingredients: ['黄瓜', '蒜瓣', '盐', '糖', '醋', '香油'],
      mealTimes: ['breakfast', 'lunch', 'dinner', 'late_night'],
      dishTypes: ['cold'],
      timeCost: 10,
      difficulty: 'easy'
    },
    {
      id: '12',
      name: '红烧茄子',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E7%BA%A2%E7%83%A7%E8%8C%84%E5%AD%90',
      description:
        '软糯入味的红烧茄子，汤汁拌饭也很香，是超受欢迎的家常素菜。',
      ingredients: ['茄子', '蒜瓣', '酱油', '糖', '蚝油', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 25,
      difficulty: 'easy'
    },
    {
      id: '13',
      name: '土豆炖牛肉',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%9C%9F%E8%B1%86%E7%82%96%E7%89%9B%E8%82%89',
      description:
        '经典炖菜组合，软烂的牛肉配上面面糯糯的土豆，是秋冬必备的暖胃菜。',
      ingredients: ['牛肉', '土豆', '胡萝卜', '洋葱', '姜', '酱油', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 90,
      difficulty: 'hard'
    },
    {
      id: '14',
      name: '清炒西葫芦',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E6%B8%85%E7%82%92%E8%A5%BF%E8%91%AB%E8%8A%A6',
      description:
        '非常清爽的素炒家常菜，几分钟就能端上桌，适合作为日常配菜。',
      ingredients: ['西葫芦', '蒜瓣', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 10,
      difficulty: 'easy'
    },
    {
      id: '15',
      name: '酸辣土豆丝',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%85%B8%E8%BE%A3%E5%9C%9F%E8%B1%86%E4%B8%9D',
      description:
        '家常土豆丝的姐妹版，酸脆带一点点微辣，非常开胃，拌饭超香。',
      ingredients: ['土豆', '青椒', '干辣椒', '醋', '盐', '糖'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '16',
      name: '可乐鸡翅',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%8F%AF%E4%B9%90%E9%B8%A1%E7%BF%85',
      description:
        '甜中带咸、老少皆宜的一道家常鸡翅，汤汁拌饭也很好吃。',
      ingredients: ['鸡翅', '可乐', '酱油', '姜', '蒜瓣', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 35,
      difficulty: 'easy'
    },
    {
      id: '17',
      name: '番茄牛腩面',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%95%AA%E8%8C%84%E7%89%9B%E8%85%A9%E9%9D%A2',
      description:
        '酸甜番茄搭配软烂牛腩和筋道面条，是很多人记忆里深夜那碗治愈的面。',
      ingredients: ['牛肉', '番茄', '挂面', '姜', '洋葱', '盐'],
      mealTimes: ['breakfast', 'lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 90,
      difficulty: 'hard'
    },
    {
      id: '18',
      name: '鸡蛋饼',
      coverImage:
        'https://dummyimage.com/600x400/facc15/000000&text=%E9%B8%A1%E8%9B%8B%E9%A5%BC',
      description:
        '适合早上或夜宵的家常小饼，鸡蛋香和面香融合，一口下去很有满足感。',
      ingredients: ['鸡蛋', '面粉', '葱花', '盐'],
      mealTimes: ['breakfast', 'late_night'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '19',
      name: '紫菜豆腐汤',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E7%B4%AB%E8%8F%9C%E8%B1%86%E8%85%90%E6%B1%A4',
      description:
        '简单又营养的一碗家常汤，紫菜和嫩豆腐、鸡蛋、葱花搭在一起，非常百搭。',
      ingredients: ['紫菜', '豆腐', '鸡蛋', '葱花', '盐', '香油'],
      mealTimes: ['breakfast', 'lunch', 'dinner'],
      dishTypes: ['soup'],
      timeCost: 12,
      difficulty: 'easy'
    },
    {
      id: '20',
      name: '排骨萝卜汤',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E6%8E%92%E9%AA%A8%E8%90%9D%E5%8D%9C%E6%B1%A4',
      description:
        '排骨和白萝卜的经典配搭，汤清味鲜，萝卜软糯，是很适合作为家常汤品的一道菜。',
      ingredients: ['排骨', '白萝卜', '姜', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['soup'],
      timeCost: 90,
      difficulty: 'normal'
    },
    {
      id: '21',
      name: '家常凉拌木耳',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E5%87%89%E6%8B%8C%E6%9C%A8%E8%80%B3',
      description:
        '爽脆的木耳配上蒜香和辣椒油，简单调一调就是很下饭的一道凉菜。',
      ingredients: ['木耳', '蒜瓣', '干辣椒', '香菜', '香醋', '生抽', '香油'],
      mealTimes: ['lunch', 'dinner', 'late_night'],
      dishTypes: ['cold'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '22',
      name: '麻婆豆腐',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%BA%BB%E7%88%86%E8%B1%86%E8%85%90',
      description:
        '麻辣鲜香、嫩滑下饭，是川菜里最经典的豆腐菜式之一。',
      ingredients: ['嫩豆腐', '猪肉', '豆瓣酱', '蒜瓣', '姜', '花椒', '生抽', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 25,
      difficulty: 'normal'
    },
    {
      id: '23',
      name: '青椒炒鸡蛋',
      coverImage:
        'https://dummyimage.com/600x400/facc15/000000&text=%E9%9D%92%E6%A4%92%E7%82%92%E9%B8%A1%E8%9B%8B',
      description:
        '和西红柿炒蛋一样经典的家常搭配，青椒清香配鸡蛋软嫩，非常下饭。',
      ingredients: ['鸡蛋', '青椒', '葱花', '盐'],
      mealTimes: ['breakfast', 'lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 10,
      difficulty: 'easy'
    },
    {
      id: '24',
      name: '香菇炖鸡',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E9%A6%99%E8%8F%87%E7%82%96%E9%B8%A1',
      description:
        '经典家常炖菜，鸡肉软烂入味，香菇浓香，非常适合全家分享的一锅菜。',
      ingredients: ['鸡腿', '香菇', '姜', '蒜瓣', '料酒', '生抽', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 60,
      difficulty: 'normal'
    },
    {
      id: '25',
      name: '西红柿牛腩汤',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E8%A5%BF%E7%BA%A2%E6%9F%BF%E7%89%9B%E8%85%A9%E6%B1%A4',
      description:
        '番茄酸甜配上牛腩香浓，既可以当汤也可以配面，是非常治愈的一锅汤菜。',
      ingredients: ['牛腩', '西红柿', '洋葱', '姜', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['soup'],
      timeCost: 90,
      difficulty: 'hard'
    },
    {
      id: '26',
      name: '清炒时蔬拼盘',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E6%B8%85%E7%82%92%E6%97%B6%E8%94%AC',
      description:
        '把手边的几种蔬菜一起快炒，就是一盘色彩丰富的清爽时蔬拼盘。',
      ingredients: ['西兰花', '胡萝卜', '玉米粒', '彩椒', '蒜瓣', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '27',
      name: '家常炒三丝',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E5%AE%B6%E5%B8%B8%E7%82%92%E4%B8%89%E4%B8%9D',
      description:
        '土豆、胡萝卜、青椒搭配的经典组合，爽脆又下饭的一道素菜。',
      ingredients: ['土豆', '胡萝卜', '青椒', '蒜瓣', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '28',
      name: '香煎三文鱼',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%A6%99%E7%85%8E%E4%B8%89%E6%96%87%E9%B1%BC',
      description:
        '外皮微脆、里面嫩滑的香煎三文鱼，挤一点柠檬汁就是很适合减脂的一餐。',
      ingredients: ['三文鱼', '黑胡椒', '盐', '食用油'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 20,
      difficulty: 'easy'
    },
    {
      id: '29',
      name: '香菇菜心',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E9%A6%99%E8%8F%87%E8%8F%9C%E5%BF%83',
      description:
        '清爽不油腻的家常素菜，香菇鲜味和菜心的清甜结合得刚刚好。',
      ingredients: ['香菇', '小白菜', '蒜瓣', '盐', '生抽'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '30',
      name: '金针菇肥牛卷',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%87%91%E9%92%88%E8%8F%87%E8%82%A5%E7%89%9B%E5%8D%B7',
      description:
        '火锅店人气单品的家常版，金针菇爽脆、肥牛香嫩，适合聚会和小聚餐。',
      ingredients: ['金针菇', '牛肉', '生抽', '蚝油', '糖'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 25,
      difficulty: 'normal'
    },
    {
      id: '31',
      name: '豆角焖面',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E8%B1%86%E8%A7%92%E7%84%96%E9%9D%A2',
      description:
        '一锅解决主食和菜的经典北方面食，豆角入味、面条筋道，很适合忙碌工作日。',
      ingredients: ['豆角', '猪肉', '挂面', '姜', '蒜瓣', '生抽', '老抽', '盐'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 35,
      difficulty: 'normal'
    },
    {
      id: '32',
      name: '凉拌三丝',
      coverImage:
        'https://dummyimage.com/600x400/22c55e/ffffff&text=%E5%87%89%E6%8B%8C%E4%B8%89%E4%B8%9D',
      description:
        '胡萝卜、黄瓜和土豆丝的清爽组合，夏天非常受欢迎的一道凉菜。',
      ingredients: ['胡萝卜', '黄瓜', '土豆', '蒜瓣', '香醋', '糖', '盐', '香油'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['cold'],
      timeCost: 20,
      difficulty: 'easy'
    },
    {
      id: '33',
      name: '番茄牛肉汤面',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E7%89%9B%E8%82%89%E7%95%AA%E8%8C%84%E6%B1%A4%E9%9D%A2',
      description:
        '比普通牛肉面更暖胃的一碗汤面，番茄的酸甜中和了牛肉的油腻。',
      ingredients: ['牛肉', '番茄', '挂面', '葱花', '盐'],
      mealTimes: ['breakfast', 'lunch', 'dinner'],
      dishTypes: ['main'],
      timeCost: 60,
      difficulty: 'normal'
    },
    {
      id: '34',
      name: '皮蛋瘦肉粥',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E7%9A%AE%E8%9B%8B%E7%98%A6%E8%82%89%E7%B2%A5',
      description:
        '广式茶餐厅人气粥品，在家也能做出顺滑浓稠的一碗暖胃早餐。',
      ingredients: ['大米', '猪肉', '皮蛋', '姜', '盐', '香油'],
      mealTimes: ['breakfast', 'late_night'],
      dishTypes: ['main'],
      timeCost: 60,
      difficulty: 'normal'
    },
    {
      id: '35',
      name: '葱油拌面',
      coverImage:
        'https://dummyimage.com/600x400/facc15/000000&text=%E8%91%B1%E6%B2%B9%E6%8B%8C%E9%9D%A2',
      description:
        '非常极简的一碗面，只靠葱香和酱油香就能征服味蕾。',
      ingredients: ['挂面', '大葱', '生抽', '老抽', '糖', '食用油'],
      mealTimes: ['breakfast', 'lunch', 'late_night'],
      dishTypes: ['main'],
      timeCost: 15,
      difficulty: 'easy'
    },
    {
      id: '36',
      name: '红豆沙汤圆',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%BA%A2%E8%B1%86%E6%B2%99%E6%B1%A4%E5%9C%86',
      description:
        '糯米汤圆配上细腻红豆沙，是很适合作为饭后甜点的一碗暖心甜品。',
      ingredients: ['糯米粉', '红豆沙', '白糖'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['dessert'],
      timeCost: 40,
      difficulty: 'normal'
    },
    {
      id: '37',
      name: '芒果椰奶西米露',
      coverImage:
        'https://dummyimage.com/600x400/facc15/000000&text=%E8%8A%92%E6%9E%9C%E8%A5%B0%E5%A5%B6%E8%A5%BF%E7%B1%B3%E9%9C%B2',
      description:
        '清爽又有奶香的经典甜品，冰镇后口感更好，夏天很受欢迎。',
      ingredients: ['西米', '芒果', '椰奶', '牛奶', '白糖'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['dessert'],
      timeCost: 30,
      difficulty: 'easy'
    },
    {
      id: '38',
      name: '柠檬蜂蜜水',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E6%9F%A0%E6%AA%AC%E8%9C%82%E8%9C%9C%E6%B0%B4',
      description:
        '简单又解腻的一杯饮品，冰镇或温饮都很适合日常搭配餐食。',
      ingredients: ['柠檬', '蜂蜜'],
      mealTimes: ['breakfast', 'lunch', 'dinner', 'late_night'],
      dishTypes: ['drink'],
      timeCost: 5,
      difficulty: 'easy'
    },
    {
      id: '39',
      name: '酸梅汤',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E9%85%B8%E6%A2%85%E6%B1%A4',
      description:
        '夏天非常受欢迎的传统饮品，酸甜开胃、解暑又解腻。',
      ingredients: ['乌梅', '山楂干', '冰糖', '桂花'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['drink'],
      timeCost: 60,
      difficulty: 'normal'
    },
    {
      id: '40',
      name: '卤鸡爪',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%8D%A4%E9%B8%A1%E7%88%AA',
      description:
        'Q 弹入味的卤鸡爪，是很多人追剧、聚会时喜欢的小零食和下酒菜。',
      ingredients: ['鸡爪', '八角', '桂皮', '香叶', '生抽', '老抽', '冰糖'],
      mealTimes: ['late_night', 'dinner'],
      dishTypes: ['braised'],
      timeCost: 90,
      difficulty: 'normal'
    },
    {
      id: '41',
      name: '卤牛腱',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%8D%A4%E7%89%9B%E8%85%B1',
      description:
        '切片冷吃或热吃都很香的一道卤味，适合作为凉菜拼盘或便当菜。',
      ingredients: ['牛腱子肉', '八角', '桂皮', '香叶', '姜', '生抽', '老抽', '冰糖'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['braised'],
      timeCost: 120,
      difficulty: 'hard'
    },
    {
      id: '42',
      name: '孜然烤羊肉串',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%AD%9C%E7%84%B6%E7%BE%8A%E8%82%89%E4%B8%B2',
      description:
        '街边烧烤摊同款的家常版，孜然和辣椒粉的香味扑鼻而来，非常下饭。',
      ingredients: ['羊肉', '孜然粉', '辣椒粉', '盐', '食用油'],
      mealTimes: ['dinner', 'late_night'],
      dishTypes: ['bbq'],
      timeCost: 40,
      difficulty: 'normal'
    },
    {
      id: '43',
      name: '烤翅中',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%83%A4%E7%BF%85%E4%B8%AD',
      description:
        '腌制入味后放进烤箱就能完成，外皮微焦、里面多汁，是聚会人气菜品。',
      ingredients: ['鸡翅中', '生抽', '蚝油', '蜂蜜', '黑胡椒'],
      mealTimes: ['dinner', 'late_night'],
      dishTypes: ['bbq'],
      timeCost: 60,
      difficulty: 'easy'
    },
    {
      id: '44',
      name: '番茄牛腩火锅',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E7%95%AA%E8%8C%84%E7%89%9B%E8%85%9B%E7%81%AB%E9%94%85',
      description:
        '番茄汤底配上牛腩和多种蔬菜的家用小火锅，酸甜开胃、汤也很好喝。',
      ingredients: ['牛腩', '番茄', '金针菇', '香菇', '土豆', '生菜', '高汤或清水'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['hotpot'],
      timeCost: 90,
      difficulty: 'normal'
    },
    {
      id: '45',
      name: '麻辣牛油火锅',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%BA%BB%E8%BE%A3%E7%89%9B%E6%B2%B9%E7%81%AB%E9%94%85',
      description:
        '参考川渝风味的麻辣火锅底，在家就能做出香辣过瘾的一锅红汤火锅。',
      ingredients: ['牛油火锅底料', '豆瓣酱', '辣椒', '花椒', '高汤或清水'],
      mealTimes: ['lunch', 'dinner', 'late_night'],
      dishTypes: ['hotpot'],
      timeCost: 60,
      difficulty: 'hard'
    },
    {
      id: '46',
      name: '椒盐虾',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E6%A4%92%E7%9B%90%E8%99%BE',
      description:
        '外壳酥脆、虾肉鲜嫩的经典家常油炸菜，撒上椒盐后香味更浓。',
      ingredients: ['大虾', '淀粉', '椒盐', '食用油'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['fried'],
      timeCost: 30,
      difficulty: 'normal'
    },
    {
      id: '47',
      name: '炸鸡块',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%82%B8%E9%B8%A1%E5%9D%97',
      description:
        '腌制好的鸡块裹上脆浆下锅炸，外酥里嫩，是小朋友特别喜欢的一道零食菜。',
      ingredients: ['鸡胸肉', '鸡蛋', '面粉', '面包糠', '盐', '黑胡椒', '食用油'],
      mealTimes: ['lunch', 'dinner', 'late_night'],
      dishTypes: ['fried'],
      timeCost: 40,
      difficulty: 'normal'
    },
    {
      id: '48',
      name: '烤红薯',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%83%A4%E7%BA%A2%E8%96%AF',
      description:
        '只需要一个烤箱就能完成的健康小甜点，红薯烤到软糯香甜，直接当主食或零食都可以。',
      ingredients: ['红薯'],
      mealTimes: ['breakfast', 'lunch', 'dinner', 'late_night'],
      dishTypes: ['baked'],
      timeCost: 50,
      difficulty: 'easy'
    },
    {
      id: '49',
      name: '芝士焗土豆泥',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E8%8A%9D%E5%A3%AB%E7%84%97%E5%9C%9F%E8%B1%86%E6%B3%A5',
      description:
        '土豆泥铺上厚厚一层芝士，表面烤至金黄拉丝，是很受欢迎的烤箱菜。',
      ingredients: ['土豆', '黄油', '牛奶', '芝士'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['baked'],
      timeCost: 40,
      difficulty: 'normal'
    },
    {
      id: '50',
      name: '三文鱼刺身拼盘',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E4%B8%89%E6%96%87%E9%B1%BC%E5%88%BA%E8%BA%AB',
      description:
        '选用新鲜三文鱼切片，搭配芥末和酱油，是日式料理中最经典的刺身之一。',
      ingredients: ['三文鱼刺身', '芥末', '生抽'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['sashimi'],
      timeCost: 20,
      difficulty: 'normal'
    },
    {
      id: '51',
      name: '北极贝刺身拼盘',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E5%8C%97%E6%9E%81%E8%B4%9D%E5%88%BA%E8%BA%AB',
      description:
        '爽脆的北极贝搭配少量蔬菜点缀，蘸芥末酱油即可食用，口感清爽鲜甜。',
      ingredients: ['北极贝刺身', '黄瓜', '生菜', '芥末', '生抽'],
      mealTimes: ['lunch', 'dinner'],
      dishTypes: ['sashimi'],
      timeCost: 20,
      difficulty: 'normal'
    },
    {
      id: '52',
      name: '冰美式咖啡',
      coverImage:
        'https://dummyimage.com/600x400/0ea5e9/ffffff&text=%E5%86%B0%E7%BE%8E%E5%BC%8F%E5%92%96%E5%95%A1',
      description:
        '只需要咖啡和冰块，就能搞定一杯清爽又醒神的日常冰咖啡。',
      ingredients: ['浓缩咖啡', '冰块'],
      mealTimes: ['breakfast', 'lunch', 'late_night'],
      dishTypes: ['drink'],
      timeCost: 5,
      difficulty: 'easy'
    },
    {
      id: '53',
      name: '草莓酸奶昔',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E8%8D%89%E8%8E%93%E9%85%B8%E5%A5%B6%E6%98%94',
      description: '草莓和酸奶打成的顺滑饮品，早餐或下午茶都很合适。',
      ingredients: ['草莓', '酸奶', '蜂蜜'],
      mealTimes: ['breakfast', 'lunch', 'late_night'],
      dishTypes: ['drink'],
      timeCost: 10,
      difficulty: 'easy'
    },
    {
      id: '54',
      name: '暖姜茶',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E6%9A%96%E5%A7%9C%E8%8C%B6',
      description: '简单的姜片配红糖，用热水冲泡就是一杯暖身小饮品。',
      ingredients: ['姜', '红糖'],
      mealTimes: ['breakfast', 'late_night'],
      dishTypes: ['drink'],
      timeCost: 8,
      difficulty: 'easy'
    },
    {
      id: '55',
      name: '蒜香烤玉米',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E8%92%9C%E9%A6%99%E7%83%A4%E7%8E%89%E7%B1%B3',
      description: '玉米刷上蒜香黄油送进烤箱，表面微焦、里面香甜多汁。',
      ingredients: ['甜玉米', '黄油', '蒜瓣', '盐', '黑胡椒'],
      mealTimes: ['lunch', 'dinner', 'late_night'],
      dishTypes: ['bbq'],
      timeCost: 30,
      difficulty: 'easy'
    },
    {
      id: '56',
      name: '秘制烤鸡翅根',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E7%A7%98%E5%88%B6%E7%83%A4%E9%B8%A1%E7%BF%85%E6%A0%B9',
      description:
        '提前腌制入味的鸡翅根，高温烤到外皮焦香、肉质多汁，是聚会人气烧烤菜。',
      ingredients: ['鸡翅根', '生抽', '蚝油', '蜂蜜', '孜然粉'],
      mealTimes: ['dinner', 'late_night'],
      dishTypes: ['bbq'],
      timeCost: 45,
      difficulty: 'easy'
    },
    {
      id: '57',
      name: '巧克力豆曲奇',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E5%B7%A7%E5%85%8B%E5%8A%9B%E6%9B%B2%E5%A5%87',
      description: '酥脆香浓的家常曲奇，巧克力豆是小朋友的最爱。',
      ingredients: ['低筋面粉', '黄油', '鸡蛋', '白糖', '巧克力豆'],
      mealTimes: ['breakfast', 'lunch', 'late_night'],
      dishTypes: ['baked'],
      timeCost: 40,
      difficulty: 'normal'
    },
    {
      id: '58',
      name: '香蕉玛芬小蛋糕',
      coverImage:
        'https://dummyimage.com/600x400/f97316/ffffff&text=%E9%A6%99%E8%95%89%E7%8E%9B%E8%8A%AC',
      description:
        '用熟香蕉做成的小蛋糕，口感湿润绵软，很适合当早餐或点心。',
      ingredients: ['香蕉', '低筋面粉', '鸡蛋', '黄油', '白糖'],
      mealTimes: ['breakfast', 'lunch', 'late_night'],
      dishTypes: ['baked'],
      timeCost: 35,
      difficulty: 'normal'
    }
  ];
}

