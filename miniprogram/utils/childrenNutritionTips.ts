/** 儿童营养小贴士库（按年龄段），供宝宝餐方案页展示与刷新 */

export interface ChildNutritionTip {
  icon: string;
  label: string;
  value: string;
  highlight: string;
}

export const CHILDREN_NUTRITION_DB: Record<'toddler' | 'preschool' | 'school', ChildNutritionTip[]> = {
  toddler: [
    { icon: '/assets/调料瓶.png', label: '一岁内不加盐糖', value: '肾脏未成熟，酱油、盐、糖、蜂蜜都应避免', highlight: '清淡原味' },
    { icon: '/assets/鸡蛋.png', label: '辅食从单一食材开始', value: '新食物一次一种、观察 3 天，便于排查过敏', highlight: '排敏原则' },
    { icon: '/assets/20_米饭.png', label: '铁强化米粉作首选谷物', value: '6 月龄后及时补铁，预防缺铁性贫血', highlight: '补铁优先' },
    { icon: '/assets/月亮.png', label: '维生素 D 要坚持', value: '遵医嘱补充，促进钙吸收与骨骼发育', highlight: '每日补充' },
    { icon: '/assets/粥.png', label: '质地从泥到末过渡', value: '7–9 月泥糊状，10–12 月可尝试软碎末', highlight: '循序渐进' },
    { icon: '/assets/不要.png', label: '禁蜂蜜与整粒坚果', value: '肉毒杆菌风险与窒息风险，坚果需完全磨碎', highlight: '安全第一' },
    { icon: '/assets/饮品.png', label: '水分主要来自奶与辅食', value: '6 月龄前母乳/配方奶即可，不必强求大量白水', highlight: '科学补水' },
    { icon: '/assets/鸡蛋2.png', label: '蛋黄由少到多', value: '从 1/8 个开始，确认无反应再逐渐加量', highlight: '缓慢加蛋黄' },
    { icon: '/assets/鱼.png', label: '鱼类适龄少量引入', value: '选择低汞鱼，蒸熟去刺打泥，观察反应', highlight: '优质 DHA' },
    { icon: '/assets/芒果.png', label: '果泥不能替代奶量', value: '辅食是补充，1 岁前奶仍是营养主力', highlight: '奶量为主' },
    { icon: '/assets/煮食.png', label: '现做现吃少反复加热', value: '减少营养流失与细菌滋生', highlight: '新鲜制备' },
  ],
  preschool: [
    { icon: '/assets/调料瓶.png', label: '少盐少糖养口味', value: '每天钠摄入远低于成人，少用酱油鸡精', highlight: '清淡习惯' },
    { icon: '/assets/早餐.png', label: '三餐两点更稳血糖', value: '固定时间进食，加餐选奶、水果、全麦点', highlight: '规律进餐' },
    { icon: '/assets/生鲜-蔬菜.png', label: '蔬菜彩虹搭配', value: '绿红黄紫轮流上，纤维与维生素更全面', highlight: '多彩蔬菜' },
    { icon: '/assets/甜品.png', label: '甜食与龋齿', value: '黏性糖果少给，吃完漱口或刷牙', highlight: '护牙控糖' },
    { icon: '/assets/饮品.png', label: '乳制品补钙', value: '奶或酸奶每日适量，乳糖不耐可选无乳糖奶', highlight: '骨骼发育' },
    { icon: '/assets/零食_坚果.png', label: '零食选健康款', value: '优选水果、无糖酸奶，少膨化油炸', highlight: '聪明零食' },
    { icon: '/assets/点击.png', label: '摆盘参与感', value: '让孩子选餐具或摆造型，提高尝试新菜的意愿', highlight: '趣味进食' },
    { icon: '/assets/包子.png', label: '勺与手抓并用', value: '锻炼手眼协调，允许适度「脏吃」', highlight: '自主进食' },
    { icon: '/assets/油炸.png', label: '外食少油炸', value: '多选清蒸、白灼、炖煮，酱料另放', highlight: '外食技巧' },
    { icon: '/assets/凉菜.png', label: '喝白水不喝甜饮', value: '果汁限量，奶茶碳酸饮料尽量不喝', highlight: '白水最佳' },
    { icon: '/assets/鱼.png', label: '蛋白来源多样化', value: '鱼禽蛋豆轮换，不过度依赖红肉', highlight: '均衡蛋白' },
  ],
  school: [
    { icon: '/assets/早餐.png', label: '早餐不跳过', value: '稳定上午注意力与血糖，含蛋白+全谷物更佳', highlight: '吃好早餐' },
    { icon: '/assets/零食_坚果.png', label: '课间加餐要健康', value: '坚果、水果、奶比辣条饼干更合适', highlight: '加餐选择' },
    { icon: '/assets/20_米饭.png', label: '生长突增期补钙铁', value: '奶、深绿蔬菜、瘦肉帮助身高与血红蛋白', highlight: '生长高峰' },
    { icon: '/assets/主食.png', label: '全谷物加蔬菜纤维', value: '糙米燕麦搭配，预防便秘与肥胖', highlight: '粗细搭配' },
    { icon: '/assets/饮品.png', label: '运动前后补水', value: '少量多次，剧烈运动后可补含电解质饮品', highlight: '科学喝水' },
    { icon: '/assets/凉菜.png', label: '自带午餐卫生', value: '生熟分开、保温冷藏，夏季注意变质', highlight: '带饭安全' },
    { icon: '/assets/汉堡包.png', label: '学会看配料表', value: '配料越短越好，警惕反式脂肪与过多添加糖', highlight: '读懂标签' },
    { icon: '/assets/健身.png', label: '关注生长曲线', value: '身高体重在标准区间内即可，不必盲目进补', highlight: '定期体检' },
    { icon: '/assets/晚餐.png', label: '晚餐不过饱', value: '睡前 2–3 小时结束进食，利于睡眠与消化', highlight: '晚餐七分饱' },
    { icon: '/assets/鸡蛋2.png', label: '护眼与营养', value: '叶黄素来自深绿蔬菜与蛋黄，少长时间盯屏', highlight: '护眼习惯' },
    { icon: '/assets/煮食.png', label: '家庭共餐示范', value: '家长清淡饮食，孩子更容易模仿', highlight: '榜样作用' },
  ],
};
