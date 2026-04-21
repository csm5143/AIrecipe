// 拼音转换工具

// 声母表
const SHENGMU = [
  'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h',
  'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'
];

// 韵母表（简化版，覆盖常用）
const YUNMU: Record<string, string[]> = {
  'a': ['a', 'ā', 'á', 'ǎ', 'à'], 'o': ['o', 'ō', 'ó', 'ǒ', 'ò'], 'e': ['e', 'ē', 'é', 'ě', 'è'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'], 'u': ['u', 'ū', 'ú', 'ǔ', 'ù'], 'v': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
  'ai': ['ai', 'āi', 'ái', 'ǎi', 'ài'], 'ei': ['ei', 'ēi', 'éi', 'ěi', 'èi'],
  'ao': ['ao', 'āo', 'áo', 'ǎo', 'ào'], 'ou': ['ou', 'ōu', 'óu', 'ǒu', 'òu'],
  'an': ['an', 'ān', 'án', 'ǎn', 'àn'], 'en': ['en', 'ēn', 'én', 'ěn', 'èn'],
  'ang': ['ang', 'āng', 'áng', 'ǎng', 'àng'], 'eng': ['eng', 'ēng', 'éng', 'ěng', 'èng'],
  'ong': ['ong', 'ōng', 'óng', 'ǒng', 'òng'],
  'ia': ['ia', 'iā', 'iá', 'iǎ', 'ià'], 'ie': ['ie', 'iē', 'ié', 'iě', 'iè'],
  'iao': ['iao', 'iāo', 'iáo', 'iǎo', 'iào'], 'iu': ['iu', 'iū', 'iú', 'iǔ', 'iù'],
  'ian': ['ian', 'iān', 'ián', 'iǎn', 'iàn'], 'in': ['in', 'īn', 'ín', 'ǐn', 'ìn'],
  'iang': ['iang', 'iāng', 'iáng', 'iǎng', 'iàng'], 'ing': ['ing', 'īng', 'íng', 'ǐng', 'ìng'],
  'iong': ['iong', 'iōng', 'ióng', 'iǒng', 'iòng'],
  'ua': ['ua', 'uā', 'úa', 'uǎ', 'uà'], 'uo': ['uo', 'uō', 'uó', 'uǒ', 'uò'],
  'uai': ['uai', 'uāi', 'uái', 'uǎi', 'uài'], 'ui': ['ui', 'uī', 'uí', 'uǐ', 'uì'],
  'uan': ['uan', 'uān', 'uán', 'uǎn', 'uàn'], 'un': ['un', 'ūn', 'ún', 'ǔn', 'ùn'],
  'uang': ['uang', 'uāng', 'uáng', 'uǎng', 'uàng'],
};

/**
 * 中文 → 拼音（首字母 + 全拼）
 * 粗略实现，仅处理常见汉字
 */
export function toPinyin(ch: string): string {
  const map: Record<string, string> = {
    '阿': 'a', '啊': 'a', '爱': 'ai', '安': 'an', '暗': 'an',
    '八': 'ba', '把': 'ba', '爸': 'ba', '吧': 'ba', '白': 'bai', '百': 'bai', '摆': 'bai', '败': 'bai',
    '班': 'ban', '半': 'ban', '办': 'ban', '棒': 'bang', '包': 'bao', '保': 'bao', '报': 'bao',
    '北': 'bei', '被': 'bei', '本': 'ben', '比': 'bi', '笔': 'bi', '边': 'bian', '变': 'bian', '煸': 'bian',
    '别': 'bie', '病': 'bing', '冰': 'bing', '波': 'bo', '博': 'bo', '不': 'bu', '步': 'bu',
    '才': 'cai', '菜': 'cai', '彩': 'cai', '餐': 'can', '参': 'can', '草': 'cao',
    '测': 'ce', '茶': 'cha', '查': 'cha', '差': 'cha', '常': 'chang', '场': 'chang',
    '唱': 'chang', '超': 'chao', '朝': 'chao', '车': 'che', '彻': 'che', '陈': 'chen',
    '称': 'cheng', '吃': 'chi', '持': 'chi', '池': 'chi', '冲': 'chong', '出': 'chu',
    '除': 'chu', '厨': 'chu', '楚': 'chu', '处': 'chu', '传': 'chuan', '春': 'chun',
    '词': 'ci', '此': 'ci', '次': 'ci', '刺': 'ci', '从': 'cong', '葱': 'cong',
    '粗': 'cu', '醋': 'cu', '村': 'cun', '错': 'cuo', '打': 'da', '大': 'da', '带': 'dai',
    '代': 'dai', '待': 'dai', '单': 'dan', '蛋': 'dan', '当': 'dang', '倒': 'dao',
    '道': 'dao', '到': 'dao', '得': 'de', '的': 'de', '等': 'deng', '低': 'di', '底': 'di',
    '地': 'di', '弟': 'di', '点': 'dian', '电': 'dian', '调': 'diao', '掉': 'diao',
    '丁': 'ding', '定': 'ding', '冬': 'dong', '东': 'dong', '懂': 'dong', '动': 'dong',
    '都': 'dou', '豆': 'dou', '读': 'du', '肚': 'du', '段': 'duan', '断': 'duan',
    '对': 'dui', '吨': 'dun', '多': 'duo', '夺': 'duo', '鹅': 'e', '饿': 'e', '儿': 'er',
    '耳': 'er', '二': 'er', '发': 'fa', '法': 'fa', '番': 'fan', '饭': 'fan', '方': 'fang',
    '放': 'fang', '非': 'fei', '肥': 'fei', '费': 'fei', '分': 'fen', '纷': 'fen',
    '粉': 'fen', '份': 'fen', '风': 'feng', '封': 'feng', '蜂': 'feng', '佛': 'fo',
    '否': 'fou', '夫': 'fu', '服': 'fu', '福': 'fu', '辅': 'fu', '父': 'fu', '付': 'fu',
    '附': 'fu', '复': 'fu', '副': 'fu', '富': 'fu', '该': 'gai', '改': 'gai', '盖': 'gai',
    '干': 'gan', '感': 'gan', '刚': 'gang', '高': 'gao', '告': 'gao', '戈': 'ge',
    '哥': 'ge', '鸽': 'ge', '格': 'ge', '个': 'ge', '给': 'gei', '根': 'gen', '工': 'gong',
    '功': 'gong', '攻': 'gong', '公': 'gong', '共': 'gong', '供': 'gong', '宫': 'gong',
    '狗': 'gou', '够': 'gou', '古': 'gu', '谷': 'gu', '股': 'gu', '骨': 'gu', '鼓': 'gu',
    '故': 'gu', '瓜': 'gua', '挂': 'gua', '关': 'guan', '观': 'guan', '管': 'guan',
    '光': 'guang', '广': 'guang', '归': 'gui', '规': 'gui', '鬼': 'gui', '贵': 'gui',
    '国': 'guo', '过': 'guo', '哈': 'ha', '还': 'hai', '孩': 'hai', '海': 'hai',
    '害': 'hai', '含': 'han', '寒': 'han', '汉': 'han', '行': 'hang', '号': 'hao',
    '好': 'hao', '喝': 'he', '合': 'he', '何': 'he', '和': 'he', '河': 'he', '黑': 'hei',
    '很': 'hen', '红': 'hong', '后': 'hou', '呼': 'hu', '胡': 'hu', '湖': 'hu',
    '虎': 'hu', '护': 'hu', '花': 'hua', '化': 'hua', '划': 'hua', '华': 'hua',
    '话': 'hua', '画': 'hua', '还': 'huan', '环': 'huan', '换': 'huan', '黄': 'huang',
    '回': 'hui', '汇': 'hui', '会': 'hui', '烩': 'hui', '昏': 'hun', '混': 'hun',
    '活': 'huo', '火': 'huo', '或': 'huo', '货': 'huo', '获': 'huo', '鸡': 'ji',
    '级': 'ji', '极': 'ji', '机': 'ji', '迹': 'ji', '基': 'ji', '及': 'ji', '集': 'ji',
    '几': 'ji', '己': 'ji', '技': 'ji', '既': 'ji', '记': 'ji', '季': 'ji', '继': 'ji',
    '济': 'ji', '加': 'jia', '夹': 'jia', '家': 'jia', '加': 'jia', '甲': 'jia',
    '假': 'jia', '价': 'jia', '嫁': 'jia', '监': 'jian', '减': 'jian', '简': 'jian',
    '见': 'jian', '建': 'jian', '件': 'jian', '健': 'jian', '舰': 'jian', '姜': 'jiang',
    '将': 'jiang', '奖': 'jiang', '讲': 'jiang', '酱': 'jiang', '交': 'jiao',
    '郊': 'jiao', '胶': 'jiao', '焦': 'jiao', '角': 'jiao', '脚': 'jiao', '饺': 'jiao',
    '搅': 'jiao', '叫': 'jiao', '轿': 'jiao', '较': 'jiao', '街': 'jie', '阶': 'jie',
    '接': 'jie', '节': 'jie', '姐': 'jie', '解': 'jie', '届': 'jie', '金': 'jin',
    '今': 'jin', '仅': 'jin', '尽': 'jin', '紧': 'jin', '锦': 'jin', '进': 'jin',
    '近': 'jin', '劲': 'jin', '晋': 'jin', '浸': 'jin', '京': 'jing', '经': 'jing',
    '精': 'jing', '景': 'jing', '警': 'jing', '净': 'jing', '竟': 'jing', '竞': 'jing',
    '竟': 'jing', '竟': 'jing', '静': 'jing', '境': 'jing', '镜': 'jing', '纠': 'jiu',
    '究': 'jiu', '九': 'jiu', '久': 'jiu', '酒': 'jiu', '旧': 'jiu', '救': 'jiu',
    '就': 'jiu', '举': 'ju', '句': 'ju', '巨': 'ju', '具': 'ju', '俱': 'ju', '剧': 'ju',
    '据': 'ju', '距': 'ju', '聚': 'ju', '卷': 'juan', '决': 'jue', '角': 'jue',
    '绝': 'jue', '觉': 'jue', '均': 'jun', '菌': 'jun', '军': 'jun', '均': 'jun',
    '卡': 'ka', '开': 'kai', '看': 'kan', '康': 'kang', '考': 'kao', '烤': 'kao',
    '靠': 'kao', '科': 'ke', '可': 'ke', '克': 'ke', '课': 'ke', '肯': 'ken',
    '空': 'kong', '口': 'kou', '扣': 'kou', '苦': 'ku', '库': 'ku', '酷': 'ku',
    '跨': 'kua', '块': 'kuai', '快': 'kuai', '宽': 'kuan', '款': 'kuan', '狂': 'kuang',
    '况': 'kuang', '矿': 'kuang', '亏': 'kui', '开': 'kai', '葵': 'kui', '困': 'kun',
    '扩': 'kuo', '拉': 'la', '蜡': 'la', '辣': 'la', '来': 'lai', '赖': 'lai',
    '蓝': 'lan', '兰': 'lan', '拦': 'lan', '栏': 'lan', '懒': 'lan', '烂': 'lan',
    '浪': 'lang', '捞': 'lao', '老': 'lao', '乐': 'le', '勒': 'lei', '雷': 'lei',
    '泪': 'lei', '累': 'lei', '冷': 'leng', '离': 'li', '里': 'li', '理': 'li',
    '梨': 'li', '利': 'li', '立': 'li', '力': 'li', '历': 'li', '厉': 'li', '沥': 'li',
    '例': 'li', '栗': 'li', '连': 'lian', '联': 'lian', '廉': 'lian', '恋': 'lian',
    '炼': 'lian', '练': 'lian', '粮': 'liang', '凉': 'liang', '两': 'liang',
    '亮': 'liang', '量': 'liang', '梁': 'liang', '良': 'liang', '辆': 'liang',
    '列': 'lie', '裂': 'lie', '猎': 'lie', '林': 'lin', '临': 'lin', '邻': 'lin',
    '淋': 'lin', '灵': 'ling', '铃': 'ling', '零': 'ling', '领': 'ling', '令': 'ling',
    '另': 'ling', '留': 'liu', '流': 'liu', '六': 'liu', '龙': 'long', '隆': 'long',
    '楼': 'lou', '搂': 'lou', '漏': 'lou', '露': 'lou', '卢': 'lu', '炉': 'lu',
    '陆': 'lu', '录': 'lu', '鹿': 'lu', '绿': 'lv', '旅': 'lv', '率': 'lv',
    '虑': 'lv', '律': 'lv', '滤': 'lv', '卵': 'luan', '乱': 'luan', '略': 'lve',
    '伦': 'lun', '轮': 'lun', '论': 'lun', '罗': 'luo', '萝': 'luo', '逻': 'luo',
    '裸': 'luo', '洛': 'luo', '骆': 'luo', '妈': 'ma', '麻': 'ma', '马': 'ma',
    '码': 'ma', '蚂': 'ma', '骂': 'ma', '吗': 'ma', '买': 'mai', '麦': 'mai',
    '卖': 'mai', '馒': 'man', '满': 'man', '慢': 'man', '漫': 'man', '芒': 'mang',
    '忙': 'mang', '盲': 'mang', '猫': 'mao', '毛': 'mao', '矛': 'mao', '茅': 'mao',
    '冒': 'mao', '帽': 'mao', '没': 'mei', '每': 'mei', '美': 'mei', '妹': 'mei',
    '门': 'men', '闷': 'men', '们': 'men', '萌': 'meng', '盟': 'meng', '猛': 'meng',
    '梦': 'meng', '迷': 'mi', '米': 'mi', '秘': 'mi', '密': 'mi', '蜜': 'mi',
    '眠': 'mian', '面': 'mian', '苗': 'miao', '描': 'miao', '秒': 'miao', '妙': 'miao',
    '庙': 'miao', '灭': 'mie', '民': 'min', '敏': 'min', '名': 'ming', '明': 'ming',
    '鸣': 'ming', '命': 'ming', '谬': 'miu', '摸': 'mo', '膜': 'mo', '摩': 'mo',
    '磨': 'mo', '魔': 'mo', '末': 'mo', '莫': 'mo', '墨': 'mo', '默': 'mo',
    '谋': 'mou', '某': 'mou', '母': 'mu', '木': 'mu', '目': 'mu', '牧': 'mu',
    '墓': 'mu', '幕': 'mu', '慕': 'mu', '拿': 'na', '哪': 'na', '那': 'na', '纳': 'na',
    '娜': 'na', '钠': 'na', '奶': 'nai', '耐': 'nai', '男': 'nan', '南': 'nan',
    '难': 'nan', '囊': 'nang', '脑': 'nao', '闹': 'nao', '呢': 'ne', '内': 'nei',
    '嫩': 'nen', '能': 'neng', '你': 'ni', '泥': 'ni', '尼': 'ni', '年': 'nian',
    '念': 'nian', '娘': 'niang', '酿': 'niang', '鸟': 'niao', '尿': 'niao',
    '捏': 'nie', '您': 'nin', '宁': 'ning', '牛': 'niu', '扭': 'niu', '纽': 'niu',
    '农': 'nong', '浓': 'nong', '弄': 'nong', '奴': 'nu', '努': 'nu', '怒': 'nu',
    '女': 'nv', '暖': 'nuan', '虐': 'nve', '疟': 'nve', '挪': 'nuo', '糯': 'nuo',
    '诺': 'nuo', '欧': 'ou', '偶': 'ou', '怕': 'pa', '拍': 'pai', '排': 'pai',
    '牌': 'pai', '派': 'pai', '潘': 'pan', '盘': 'pan', '判': 'pan', '叛': 'pan',
    '庞': 'pang', '旁': 'pang', '胖': 'pang', '抛': 'pao', '袍': 'pao', '跑': 'pao',
    '泡': 'pao', '培': 'pei', '赔': 'pei', '配': 'pei', '朋': 'peng', '彭': 'peng',
    '棚': 'peng', '蓬': 'peng', '碰': 'peng', '批': 'pi', '披': 'pi', '皮': 'pi',
    '疲': 'pi', '脾': 'pi', '匹': 'pi', '屁': 'pi', '偏': 'pian', '片': 'pian',
    '骗': 'pian', '飘': 'piao', '票': 'piao', '拼': 'pin', '贫': 'pin', '频': 'pin',
    '品': 'pin', '聘': 'pin', '平': 'ping', '评': 'ping', '凭': 'ping', '苹': 'ping',
    '坡': 'po', '泼': 'po', '破': 'po', '迫': 'po', '铺': 'pu', '葡': 'pu', '普': 'pu',
    '谱': 'pu', '七': 'qi', '期': 'qi', '其': 'qi', '奇': 'qi', '歧': 'qi', '骑': 'qi',
    '棋': 'qi', '旗': 'qi', '企': 'qi', '起': 'qi', '气': 'qi', '汽': 'qi', '器': 'qi',
    '砌': 'qi', '弃': 'qi', '掐': 'qia', '恰': 'qia', '恰': 'qia', '千': 'qian',
    '牵': 'qian', '铅': 'qian', '谦': 'qian', '签': 'qian', '前': 'qian', '钱': 'qian',
    '钳': 'qian', '浅': 'qian', '欠': 'qian', '强': 'qiang', '墙': 'qiang', '抢': 'qiang',
    '悄': 'qiao', '敲': 'qiao', '桥': 'qiao', '巧': 'qiao', '鞘': 'qiao', '翘': 'qiao',
    '切': 'qie', '茄': 'qie', '且': 'qie', '窃': 'qie', '侵': 'qin', '亲': 'qin',
    '秦': 'qin', '琴': 'qin', '勤': 'qin', '青': 'qing', '轻': 'qing', '氢': 'qing',
    '倾': 'qing', '清': 'qing', '晴': 'qing', '情': 'qing', '请': 'qing', '庆': 'qing',
    '穷': 'qiong', '秋': 'qiu', '求': 'qiu', '球': 'qiu', '区': 'qu', '曲': 'qu',
    '曲': 'qu', '驱': 'qu', '屈': 'qu', '渠': 'qu', '取': 'qu', '去': 'qu', '趣': 'qu',
    '全': 'quan', '权': 'quan', '泉': 'quan', '劝': 'quan', '券': 'quan', '缺': 'que',
    '却': 'que', '雀': 'que', '确': 'que', '群': 'qun', '然': 'ran', '燃': 'ran',
    '染': 'ran', '让': 'rang', '饶': 'rao', '扰': 'rao', '绕': 'rao', '热': 're',
    '人': 'ren', '仁': 'ren', '忍': 'ren', '认': 'ren', '任': 'ren', '日': 'ri',
    '荣': 'rong', '绒': 'rong', '容': 'rong', '溶': 'rong', '熔': 'rong', '融': 'rong',
    '肉': 'rou', '如': 'ru', '入': 'ru', '软': 'ruan', '锐': 'rui', '瑞': 'rui',
    '若': 'ruo', '弱': 'ruo', '洒': 'sa', '撒': 'sa', '萨': 'sa', '三': 'san',
    '散': 'san', '桑': 'sang', '嗓': 'sang', '丧': 'sang', '扫': 'sao', '嫂': 'sao',
    '色': 'se', '森': 'sen', '僧': 'seng', '沙': 'sha', '砂': 'sha', '杀': 'sha',
    '啥': 'sha', '傻': 'sha', '山': 'shan', '删': 'shan', '衫': 'shan', '闪': 'shan',
    '善': 'shan', '扇': 'shan', '商': 'shang', '伤': 'shang', '赏': 'shang',
    '上': 'shang', '尚': 'shang', '烧': 'shao', '稍': 'shao', '勺': 'shao',
    '少': 'shao', '绍': 'shao', '舌': 'she', '蛇': 'she', '舍': 'she', '设': 'she',
    '社': 'she', '射': 'she', '涉': 'she', '摄': 'she', '谁': 'shei', '深': 'shen',
    '什': 'shen', '神': 'shen', '审': 'shen', '肾': 'shen', '甚': 'shen', '渗': 'shen',
    '生': 'sheng', '声': 'sheng', '升': 'sheng', '省': 'sheng', '胜': 'sheng',
    '盛': 'sheng', '剩': 'sheng', '尸': 'shi', '失': 'shi', '师': 'shi', '诗': 'shi',
    '施': 'shi', '湿': 'shi', '十': 'shi', '石': 'shi', '时': 'shi', '实': 'shi',
    '食': 'shi', '识': 'shi', '史': 'shi', '使': 'shi', '始': 'shi', '驶': 'shi',
    '士': 'shi', '世': 'shi', '柿': 'shi', '事': 'shi', '是': 'shi', '适': 'shi',
    '室': 'shi', '试': 'shi', '视': 'shi', '收': 'shou', '手': 'shou', '守': 'shou',
    '首': 'shou', '寿': 'shou', '受': 'shou', '授': 'shou', '兽': 'shou', '售': 'shou',
    '瘦': 'shou', '书': 'shu', '输': 'shu', '蔬': 'shu', '枢': 'shu', '叔': 'shu',
    '殊': 'shu', '梳': 'shu', '舒': 'shu', '疏': 'shu', '赎': 'shu', '数': 'shu',
    '暑': 'shu', '属': 'shu', '术': 'shu', '树': 'shu', '竖': 'shu', '恕': 'shu',
    '庶': 'shu', '数': 'shu', '双': 'shuang', '霜': 'shuang', '爽': 'shuang',
    '水': 'shui', '睡': 'shui', '税': 'shui', '顺': 'shun', '瞬': 'shun', '说': 'shuo',
    '硕': 'shuo', '司': 'si', '丝': 'si', '思': 'si', '私': 'si', '斯': 'si',
    '死': 'si', '四': 'si', '寺': 'si', '似': 'si', '伺': 'si', '松': 'song',
    '耸': 'song', '送': 'song', '颂': 'song', '宋': 'song', '搜': 'sou', '艘': 'sou',
    '苏': 'su', '俗': 'su', '素': 'su', '速': 'su', '粟': 'su', '诉': 'su',
    '塑': 'su', '酸': 'suan', '蒜': 'suan', '算': 'suan', '虽': 'sui', '随': 'sui',
    '髓': 'sui', '岁': 'sui', '碎': 'sui', '隧': 'sui', '所': 'suo', '索': 'suo',
    '锁': 'suo', '他': 'ta', '它': 'ta', '她': 'ta', '塔': 'ta', '踏': 'ta',
    '胎': 'tai', '台': 'tai', '太': 'tai', '态': 'tai', '泰': 'tai', '贪': 'tan',
    '摊': 'tan', '滩': 'tan', '坛': 'tan', '谈': 'tan', '坦': 'tan', '叹': 'tan',
    '炭': 'tan', '汤': 'tang', '糖': 'tang', '烫': 'tang', '逃': 'tao', '桃': 'tao',
    '淘': 'tao', '讨': 'tao', '套': 'tao', '特': 'te', '疼': 'teng', '腾': 'teng',
    '梯': 'ti', '踢': 'ti', '提': 'ti', '题': 'ti', '体': 'ti', '替': 'ti',
    '天': 'tian', '添': 'tian', '田': 'tian', '甜': 'tian', '填': 'tian', '挑': 'tiao',
    '条': 'tiao', '跳': 'tiao', '贴': 'tie', '铁': 'tie', '厅': 'ting', '听': 'ting',
    '停': 'ting', '庭': 'ting', '挺': 'ting', '通': 'tong', '同': 'tong', '桐': 'tong',
    '铜': 'tong', '童': 'tong', '统': 'tong', '痛': 'tong', '偷': 'tou', '头': 'tou',
    '投': 'tou', '透': 'tou', '突': 'tu', '图': 'tu', '徒': 'tu', '途': 'tu',
    '土': 'tu', '吐': 'tu', '兔': 'tu', '团': 'tuan', '推': 'tui', '腿': 'tui',
    '退': 'tui', '吞': 'tun', '屯': 'tun', '托': 'tuo', '拖': 'tuo', '脱': 'tuo',
    '驼': 'tuo', '挖': 'wa', '娃': 'wa', '瓦': 'wa', '外': 'wai', '弯': 'wan',
    '湾': 'wan', '丸': 'wan', '完': 'wan', '玩': 'wan', '晚': 'wan', '碗': 'wan',
    '万': 'wan', '汪': 'wang', '亡': 'wang', '王': 'wang', '网': 'wang', '往': 'wang',
    '旺': 'wang', '望': 'wang', '危': 'wei', '威': 'wei', '微': 'wei', '为': 'wei',
    '维': 'wei', '围': 'wei', '委': 'wei', '卫': 'wei', '未': 'wei', '位': 'wei',
    '味': 'wei', '畏': 'wei', '胃': 'wei', '喂': 'wei', '温': 'wen', '文': 'wen',
    '纹': 'wen', '闻': 'wen', '问': 'wen', '翁': 'weng', '我': 'wo', '沃': 'wo',
    '卧': 'wo', '握': 'wo', '乌': 'wu', '屋': 'wu', '无': 'wu', '五': 'wu', '午': 'wu',
    '武': 'wu', '舞': 'wu', '务': 'wu', '物': 'wu', '误': 'wu', '西': 'xi', '希': 'xi',
    '析': 'xi', '息': 'xi', '惜': 'xi', '稀': 'xi', '溪': 'xi', '锡': 'xi', '熄': 'xi',
    '嘻': 'xi', '膝': 'xi', '习': 'xi', '洗': 'xi', '喜': 'xi', '系': 'xi', '戏': 'xi',
    '细': 'xi', '虾': 'xia', '瞎': 'xia', '峡': 'xia', '下': 'xia', '夏': 'xia',
    '吓': 'xia', '仙': 'xian', '先': 'xian', '纤': 'xian', '鲜': 'xian', '闲': 'xian',
    '贤': 'xian', '弦': 'xian', '咸': 'xian', '显': 'xian', '险': 'xian', '县': 'xian',
    '现': 'xian', '线': 'xian', '限': 'xian', '陷': 'xian', '馅': 'xian', '相': 'xiang',
    '香': 'xiang', '箱': 'xiang', '镶': 'xiang', '详': 'xiang', '想': 'xiang',
    '响': 'xiang', '享': 'xiang', '项': 'xiang', '象': 'xiang', '像': 'xiang',
    '橡': 'xiang', '小': 'xiao', '孝': 'xiao', '校': 'xiao', '效': 'xiao', '笑': 'xiao',
    '些': 'xie', '歇': 'xie', '协': 'xie', '斜': 'xie', '写': 'xie', '血': 'xie',
    '泻': 'xie', '卸': 'xie', '蟹': 'xie', '谢': 'xie', '心': 'xin', '辛': 'xin',
    '欣': 'xin', '新': 'xin', '薪': 'xin', '鲜': 'xin', '信': 'xin', '星': 'xing',
    '腥': 'xing', '行': 'xing', '形': 'xing', '型': 'xing', '醒': 'xing', '杏': 'xing',
    '姓': 'xing', '兴': 'xing', '休': 'xiu', '修': 'xiu', '羞': 'xiu', '朽': 'xiu',
    '秀': 'xiu', '袖': 'xiu', '绣': 'xiu', '须': 'xu', '虚': 'xu', '需': 'xu',
    '徐': 'xu', '许': 'xu', '序': 'xu', '叙': 'xu', '旭': 'xu', '畜': 'xu',
    '絮': 'xu', '婿': 'xu', '轩': 'xuan', '宣': 'xuan', '旋': 'xuan', '悬': 'xuan',
    '选': 'xuan', '旋': 'xuan', '券': 'xuan', '穴': 'xue', '学': 'xue', '雪': 'xue',
    '血': 'xue', '熏': 'xun', '寻': 'xun', '巡': 'xun', '询': 'xun', '循': 'xun',
    '讯': 'xun', '迅': 'xun', '鸭': 'ya', '压': 'ya', '押': 'ya', '呀': 'ya',
    '牙': 'ya', '芽': 'ya', '崖': 'ya', '哑': 'ya', '雅': 'ya', '亚': 'ya',
    '咽': 'yan', '烟': 'yan', '淹': 'yan', '盐': 'yan', '严': 'yan', '岩': 'yan',
    '炎': 'yan', '研': 'yan', '沿': 'yan', '言': 'yan', '颜': 'yan', '衍': 'yan',
    '掩': 'yan', '眼': 'yan', '演': 'yan', '厌': 'yan', '艳': 'yan', '验': 'yan',
    '焰': 'yan', '雁': 'yan', '央': 'yang', '殃': 'yang', '秧': 'yang', '扬': 'yang',
    '羊': 'yang', '阳': 'yang', '养': 'yang', '氧': 'yang', '仰': 'yang', '样': 'yang',
    '腰': 'yao', '邀': 'yao', '摇': 'yao', '遥': 'yao', '咬': 'yao', '药': 'yao',
    '要': 'yao', '耀': 'yao', '爷': 'ye', '也': 'ye', '野': 'ye', '业': 'ye',
    '叶': 'ye', '夜': 'ye', '页': 'ye', '液': 'ye', '一': 'yi', '医': 'yi', '衣': 'yi',
    '依': 'yi', '伊': 'yi', '壹': 'yi', '仪': 'yi', '夷': 'yi', '移': 'yi', '遗': 'yi',
    '疑': 'yi', '宜': 'yi', '姨': 'yi', '彝': 'yi', '以': 'yi', '已': 'yi', '乙': 'yi',
    '蚁': 'yi', '倚': 'yi', '椅': 'yi', '义': 'yi', '亿': 'yi', '艺': 'yi', '忆': 'yi',
    '议': 'yi', '亦': 'yi', '异': 'yi', '译': 'yi', '抑': 'yi', '役': 'yi', '易': 'yi',
    '疫': 'yi', '益': 'yi', '谊': 'yi', '意': 'yi', '溢': 'yi', '毅': 'yi', '翼': 'yi',
    '因': 'yin', '阴': 'yin', '音': 'yin', '银': 'yin', '引': 'yin', '饮': 'yin',
    '隐': 'yin', '印': 'yin', '应': 'ying', '英': 'ying', '樱': 'ying', '鹰': 'ying',
    '迎': 'ying', '盈': 'ying', '营': 'ying', '蝇': 'ying', '赢': 'ying', '影': 'ying',
    '映': 'ying', '硬': 'ying', '哟': 'yo', '用': 'yong', '优': 'you', '忧': 'you',
    '幽': 'you', '悠': 'you', '尤': 'you', '由': 'you', '邮': 'you', '犹': 'you',
    '油': 'you', '游': 'you', '友': 'you', '有': 'you', '又': 'you', '右': 'you',
    '幼': 'you', '于': 'yu', '予': 'yu', '余': 'yu', '鱼': 'yu', '俞': 'yu', '娱': 'yu',
    '渔': 'yu', '愉': 'yu', '愚': 'yu', '与': 'yu', '宇': 'yu', '羽': 'yu', '雨': 'yu',
    '语': 'yu', '玉': 'yu', '芋': 'yu', '育': 'yu', '域': 'yu', '欲': 'yu', '遇': 'yu',
    '御': 'yu', '裕': 'yu', '预': 'yu', '豫': 'yu', '元': 'yuan', '园': 'yuan',
    '原': 'yuan', '圆': 'yuan', '袁': 'yuan', '援': 'yuan', '缘': 'yuan', '源': 'yuan',
    '远': 'yuan', '怨': 'yuan', '院': 'yuan', '愿': 'yuan', '约': 'yue', '月': 'yue',
    '乐': 'yue', '岳': 'yue', '钥': 'yue', '阅': 'yue', '悦': 'yue', '跃': 'yue',
    '越': 'yue', '云': 'yun', '匀': 'yun', '允': 'yun', '孕': 'yun', '运': 'yun',
    '晕': 'yun', '韵': 'yun', '蕴': 'yun', '再': 'zai', '在': 'zai', '咱': 'zan',
    '暂': 'zan', '赞': 'zan', '赃': 'zang', '脏': 'zang', '葬': 'zang', '遭': 'zao',
    '糟': 'zao', '早': 'zao', '枣': 'zao', '蚤': 'zao', '澡': 'zao', '灶': 'zao',
    '造': 'zao', '噪': 'zao', '燥': 'zao', '则': 'ze', '责': 'ze', '择': 'ze',
    '泽': 'ze', '贼': 'zei', '怎': 'zen', '增': 'zeng', '赠': 'zeng', '扎': 'zha',
    '炸': 'zha', '渣': 'zha', '札': 'zha', '眨': 'zha', '榨': 'zha', '乍': 'zha',
    '诈': 'zha', '宅': 'zhai', '窄': 'zhai', '债': 'zhai', '寨': 'zhai', '沾': 'zhan',
    '粘': 'zhan', '斩': 'zhan', '盏': 'zhan', '展': 'zhan', '占': 'zhan', '战': 'zhan',
    '站': 'zhan', '张': 'zhang', '掌': 'zhang', '涨': 'zhang', '丈': 'zhang',
    '杖': 'zhang', '账': 'zhang', '杖': 'zhang', '招': 'zhao', '昭': 'zhao',
    '找': 'zhao', '召': 'zhao', '照': 'zhao', '罩': 'zhao', '兆': 'zhao', '赵': 'zhao',
    '照': 'zhao', '遮': 'zhe', '折': 'zhe', '哲': 'zhe', '者': 'zhe', '这': 'zhe',
    '浙': 'zhe', '针': 'zhen', '侦': 'zhen', '珍': 'zhen', '真': 'zhen', '诊': 'zhen',
    '枕': 'zhen', '振': 'zhen', '震': 'zhen', '镇': 'zhen', '阵': 'zhen', '争': 'zheng',
    '征': 'zheng', '挣': 'zheng', '睁': 'zheng', '蒸': 'zheng', '整': 'zheng',
    '正': 'zheng', '政': 'zheng', '证': 'zheng', '症': 'zheng', '郑': 'zheng',
    '只': 'zhi', '支': 'zhi', '汁': 'zhi', '芝': 'zhi', '吱': 'zhi', '枝': 'zhi',
    '知': 'zhi', '织': 'zhi', '职': 'zhi', '直': 'zhi', '值': 'zhi', '植': 'zhi',
    '殖': 'zhi', '执': 'zhi', '止': 'zhi', '只': 'zhi', '旨': 'zhi', '指': 'zhi',
    '至': 'zhi', '志': 'zhi', '制': 'zhi', '治': 'zhi', '质': 'zhi', '秩': 'zhi',
    '致': 'zhi', '智': 'zhi', '置': 'zhi', '中': 'zhong', '忠': 'zhong', '终': 'zhong',
    '钟': 'zhong', '肿': 'zhong', '种': 'zhong', '重': 'zhong', '众': 'zhong',
    '州': 'zhou', '舟': 'zhou', '周': 'zhou', '洲': 'zhou', '粥': 'zhou', '轴': 'zhou',
    '肘': 'zhou', '帚': 'zhou', '皱': 'zhou', '骤': 'zhou', '朱': 'zhu', '珠': 'zhu',
    '株': 'zhu', '猪': 'zhu', '蛛': 'zhu', '竹': 'zhu', '烛': 'zhu', '逐': 'zhu',
    '主': 'zhu', '柱': 'zhu', '注': 'zhu', '住': 'zhu', '助': 'zhu', '贮': 'zhu',
    '驻': 'zhu', '著': 'zhu', '柱': 'zhu', '祝': 'zhu', '筑': 'zhu', '抓': 'zhua',
    '爪': 'zhua', '专': 'zhuan', '砖': 'zhuan', '转': 'zhuan', '赚': 'zhuan',
    '装': 'zhuang', '壮': 'zhuang', '状': 'zhuang', '撞': 'zhuang', '追': 'zhui',
    '坠': 'zhui', '缀': 'zhui', '准': 'zhun', '捉': 'zhuo', '桌': 'zhuo', '灼': 'zhuo',
    '浊': 'zhuo', '酌': 'zhuo', '啄': 'zhuo', '着': 'zhuo', '仔': 'zi', '姿': 'zi',
    '资': 'zi', '咨': 'zi', '滋': 'zi', '子': 'zi', '紫': 'zi', '自': 'zi', '字': 'zi',
    '宗': 'zong', '棕': 'zong', '综': 'zong', '总': 'zong', '纵': 'zong', '走': 'zou',
    '奏': 'zou', '租': 'zu', '足': 'zu', '卒': 'zu', '族': 'zu', '阻': 'zu', '组': 'zu',
    '祖': 'zu', '组': 'zu', '钻': 'zuan', '嘴': 'zui', '最': 'zui', '罪': 'zui',
    '醉': 'zui', '尊': 'zun', '遵': 'zun', '昨': 'zuo', '左': 'zuo', '作': 'zuo',
    '坐': 'zuo', '座': 'zuo', '做': 'zuo', '柞': 'zuo',
  };
  return map[ch] || '';
}

/**
 * 获取中文文本的拼音（去声调，首字母）
 * 例如："番茄炒蛋" → "fanjianchaodan"
 */
export function getPinyin(text: string): string {
  let result = '';
  for (const ch of text) {
    if (ch >= '\u4e00' && ch <= '\u9fff') {
      result += toPinyin(ch);
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * 获取中文文本的拼音首字母
 * 例如："番茄炒蛋" → "fjcd"
 */
export function getPinyinInitials(text: string): string {
  let result = '';
  for (const ch of text) {
    if (ch >= '\u4e00' && ch <= '\u9fff') {
      result += toPinyin(ch).charAt(0);
    }
  }
  return result;
}

/** 关键词是否含汉字（含中文时禁用宽松拼音子串匹配，避免「干煸」被拆成 g/gan 误匹配大量菜名） */
function keywordContainsHan(keyword: string): boolean {
  return /[\u4e00-\u9fff]/.test(keyword);
}

/**
 * 关键词是否匹配目标文本（支持中文、拼音首字母、全拼）
 * @param keyword 搜索关键词
 * @param target 目标文本（菜谱名称等）
 * @returns 是否匹配
 */
export function matchKeyword(keyword: string, target: string): boolean {
  if (!keyword || !target) return false;
  const kw = keyword.trim().toLowerCase();
  const t = target.trim();
  if (!kw || !t) return false;

  // 1. 原文包含
  if (t.toLowerCase().includes(kw)) return true;

  // 含中文的关键词仅做字面包含（上一步）；不再用拼音/首字母子串，否则未收录汉字或短缩写会导致全库误匹配
  if (keywordContainsHan(keyword.trim())) {
    return false;
  }

  // 2. 拼音全拼匹配（仅纯字母/数字类关键词）
  const targetPinyin = getPinyin(t);
  if (targetPinyin.toLowerCase().includes(kw)) return true;
  if (getPinyin(kw).length > 0 && targetPinyin.toLowerCase().includes(getPinyin(kw))) return true;

  // 3. 拼音首字母匹配
  const targetInitials = getPinyinInitials(t);
  if (targetInitials.toLowerCase().includes(kw)) return true;
  if (getPinyinInitials(kw).length > 0 && targetInitials.toLowerCase().includes(getPinyinInitials(kw))) return true;

  return false;
}
