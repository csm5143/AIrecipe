import '../models/recipe.dart';
import '../models/post.dart';
import '../models/ingredient.dart';
import '../models/notification_item.dart';
import '../models/chat.dart';

// ── 模拟 URL ──
const _imgFood1 =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
const _imgFood2 =
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80';
const _imgFood3 =
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80';
const _imgFood4 =
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80';
const _imgFood5 =
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80';

const _imgAvatar1 =
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80';
const _imgAvatar2 =
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80';

final mockRecipes = [
  Recipe(
    id: '1',
    title: 'Avocado & Egg Power Bowl',
    coverImage: _imgFood1,
    cookTime: 15,
    difficulty: 'Easy',
    ingredientCount: 6,
    calories: 320,
    rating: 4.9,
    likes: 1200,
    authorName: 'Sarah B.',
    authorAvatar: _imgAvatar1,
    ingredients: [
      const IngredientItem(name: '牛油果', amount: '1', unit: '个'),
      const IngredientItem(name: '鸡蛋', amount: '2', unit: '个'),
      const IngredientItem(name: '藜麦', amount: '100', unit: 'g'),
      const IngredientItem(name: '小番茄', amount: '5', unit: '个'),
      const IngredientItem(name: '橄榄油', amount: '1', unit: '汤匙'),
      const IngredientItem(name: '海盐', amount: '少许', unit: ''),
    ],
    steps: [
      const CookingStep(
        stepNumber: 1,
        title: '准备食材',
        description: '藜麦洗净煮熟，牛油果切片，小番茄对半切。',
      ),
      const CookingStep(
        stepNumber: 2,
        title: '煎蛋',
        description: '平底锅加少许橄榄油，煎两个太阳蛋。',
      ),
      const CookingStep(
        stepNumber: 3,
        title: '组装',
        description: '碗底铺藜麦，依次摆上牛油果、番茄、煎蛋，撒海盐调味。',
      ),
    ],
  ),
  Recipe(
    id: '2',
    title: 'Garlic Butter Salmon',
    coverImage: _imgFood2,
    cookTime: 25,
    difficulty: 'Medium',
    ingredientCount: 8,
    calories: 420,
    rating: 4.8,
    likes: 850,
    authorName: 'Chef Mike',
    authorAvatar: _imgAvatar2,
    ingredients: [
      const IngredientItem(name: '三文鱼 (带皮)', amount: '200', unit: 'g'),
      const IngredientItem(name: '新鲜芦笋', amount: '100', unit: 'g'),
      const IngredientItem(name: '无盐黄油', amount: '15', unit: 'g'),
      const IngredientItem(name: '大蒜', amount: '3', unit: '瓣'),
      const IngredientItem(name: '柠檬', amount: '半个', unit: ''),
      const IngredientItem(name: '海盐与黑胡椒', amount: '少许', unit: ''),
    ],
    steps: [
      const CookingStep(
        stepNumber: 1,
        title: '准备工作',
        description: '用厨房纸巾吸干三文鱼表面水分，两面撒海盐和黑胡椒腌制10分钟。芦笋洗净切去老根，大蒜切末。',
      ),
      const CookingStep(
        stepNumber: 2,
        title: '煎制配菜',
        description: '平底锅中火加热，加少许橄榄油，放入芦笋翻煎2-3分钟至翠绿微皱。',
      ),
      const CookingStep(
        stepNumber: 3,
        title: '煎三文鱼',
        description: '锅擦净重新加热，放入一半黄油融化，三文鱼皮面朝下煎3-4分钟至金黄酥脆，翻面再煎2分钟。',
      ),
      const CookingStep(
        stepNumber: 4,
        title: '调味出锅',
        description: '调小火，加入剩余黄油和蒜末，用勺子不断将蒜香黄油淋在鱼表面约1分钟。挤柠檬汁，装盘淋酱汁。',
      ),
    ],
  ),
  Recipe(
    id: '3',
    title: 'Classic Ragu',
    coverImage: _imgFood3,
    cookTime: 120,
    difficulty: 'Hard',
    ingredientCount: 12,
    calories: 580,
    rating: 4.7,
    likes: 620,
    authorName: '意大利面时间',
    authorAvatar: '',
  ),
  Recipe(
    id: '4',
    title: 'Summer Power Bowl',
    coverImage: _imgFood4,
    cookTime: 15,
    difficulty: 'Easy',
    ingredientCount: 7,
    calories: 280,
    rating: 4.8,
    likes: 2100,
    authorName: '健康小厨',
    authorAvatar: '',
    ingredients: [
      const IngredientItem(name: '生菜', amount: '120', unit: 'g'),
      const IngredientItem(name: '胡萝卜丝', amount: '50', unit: 'g'),
      const IngredientItem(name: '紫洋葱', amount: '1/4', unit: '个'),
      const IngredientItem(name: '黑橄榄', amount: '8', unit: '颗'),
      const IngredientItem(name: '玉米粒', amount: '30', unit: 'g'),
      const IngredientItem(name: '核桃仁', amount: '20', unit: 'g'),
      const IngredientItem(name: '低脂奶酪', amount: '30', unit: 'g'),
    ],
    steps: [
      const CookingStep(
        stepNumber: 1,
        title: '清洗切配',
        description: '生菜洗净沥干，胡萝卜刨丝，紫洋葱切圈，奶酪切小块。',
      ),
      const CookingStep(
        stepNumber: 2,
        title: '调味拌匀',
        description: '加入橄榄油、柠檬汁、海盐和黑胡椒，轻轻拌匀保持蔬菜爽脆。',
      ),
      const CookingStep(
        stepNumber: 3,
        title: '装盘完成',
        description: '铺上黑橄榄、玉米粒和核桃仁，最后撒上奶酪即可。',
      ),
    ],
  ),
  Recipe(
    id: '5',
    title: 'Matcha Crepe Cake',
    coverImage: _imgFood5,
    cookTime: 45,
    difficulty: 'Medium',
    ingredientCount: 9,
    calories: 350,
    rating: 4.6,
    likes: 3400,
    authorName: '甜品控',
    authorAvatar: '',
  ),
];

final mockPosts = [
  Post(
    id: 'p1',
    content:
        'Weekend homemade pizza night! Got the crust perfectly crispy this time.',
    imageUrl:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    authorName: 'Sarah B.',
    authorAvatar: _imgAvatar1,
    likes: 234,
    comments: 45,
    timeAgo: '2h ago',
  ),
  Post(
    id: 'p2',
    content:
        'The ultimate smashburger experiment. Secret sauce recipe in comments! 🍔',
    imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    authorName: 'Chef Mike',
    authorAvatar: _imgAvatar2,
    likes: 567,
    comments: 89,
    timeAgo: '5h ago',
  ),
];

final mockIngredients = [
  const Ingredient(id: 'i1', name: '苹果', category: '冰箱'),
  const Ingredient(id: 'i2', name: '番茄', category: '冰箱'),
  const Ingredient(id: 'i3', name: '鸡蛋', category: '冰箱', isLow: true),
  const Ingredient(id: 'i4', name: '牛奶', category: '冰箱'),
  const Ingredient(id: 'i5', name: '胡萝卜', category: '储藏室'),
  const Ingredient(id: 'i6', name: '大米', category: '储藏室'),
  const Ingredient(id: 'i7', name: '面粉', category: '储藏室'),
  const Ingredient(id: 'i8', name: '鸡胸肉', category: '生鲜'),
  const Ingredient(id: 'i9', name: '三文鱼', category: '生鲜'),
  const Ingredient(id: 'i10', name: '酱油', category: '调味'),
  const Ingredient(id: 'i11', name: '盐', category: '调味'),
];

final mockSavedRecipes = mockRecipes.sublist(0, 2);
final mockSavedPosts = mockPosts;

final mockNotifications = [
  NotificationItem(
    id: 'n1',
    type: NotificationType.ai,
    fromUserName: '小厨子',
    action: 'suggested a new recipe based on your fridge:',
    targetName: 'Lemon Herb Chicken',
    timeAgo: '15m ago',
    isUnread: true,
  ),
  NotificationItem(
    id: 'n2',
    type: NotificationType.like,
    fromUserName: 'Sarah B.',
    fromUserAvatar: _imgAvatar1,
    action: 'liked your',
    targetName: 'Perfect Morning Avocado Toast',
    targetImage: _imgFood1,
    timeAgo: '2h ago',
    isUnread: true,
  ),
  NotificationItem(
    id: 'n3',
    type: NotificationType.comment,
    fromUserName: 'Michael T.',
    fromUserAvatar: _imgAvatar2,
    action: 'commented:',
    targetName: 'Tried this substitution and it worked perfectly!',
    targetImage: _imgFood4,
    timeAgo: 'Tue',
    isUnread: false,
  ),
  NotificationItem(
    id: 'n4',
    type: NotificationType.achievement,
    fromUserName: 'System',
    action: 'You\'ve reached a',
    targetName: '7-day cooking streak!',
    timeAgo: 'Mon',
    isUnread: false,
  ),
];

final mockChatHistory = [
  ChatHistoryItem(
    id: 'c1',
    title: '高蛋白减脂餐推荐',
    preview: '为您推荐三文鱼藜麦沙拉，富含优质蛋白和碳水，制作时间只需15分钟...',
    timeAgo: '2 hours ago',
    recipeCount: 3,
    tag: 'restaurant',
  ),
  ChatHistoryItem(
    id: 'c2',
    title: '冰箱剩余食材处理',
    preview: '根据您提供的西红柿、鸡蛋和半颗洋葱，建议制作意式番茄洋葱炒蛋...',
    timeAgo: 'Yesterday',
    recipeCount: 2,
    tag: 'kitchen',
  ),
  ChatHistoryItem(
    id: 'c3',
    title: '低卡快手早餐',
    preview: '燕麦奇亚籽布丁是绝佳选择，前一天晚上准备好，第二天直接享用...',
    timeAgo: 'May 12',
    recipeCount: 1,
    tag: 'restaurant',
  ),
];
