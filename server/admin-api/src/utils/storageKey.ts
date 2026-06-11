import path from 'path';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
  '.avif',
  '.bmp',
]);

const PINYIN_MAP: Record<string, string> = {
  ai: 'ai',
  余: 'yu',
  干: 'gan',
  椒: 'jiao',
  炒: 'chao',
  鸡: 'ji',
  蛋: 'dan',
  肉: 'rou',
  牛: 'niu',
  奶: 'nai',
  小: 'xiao',
  面: 'mian',
  包: 'bao',
  紫: 'zi',
  薯: 'shu',
  粥: 'zhou',
  彩: 'cai',
  红: 'hong',
  黄: 'huang',
  青: 'qing',
  绿: 'lv',
  白: 'bai',
  黑: 'hei',
  辣: 'la',
  酸: 'suan',
  甜: 'tian',
  香: 'xiang',
  葱: 'cong',
  姜: 'jiang',
  蒜: 'suan',
  豆: 'dou',
  腐: 'fu',
  土: 'tu',
  西: 'xi',
  番: 'fan',
  茄: 'qie',
  菜: 'cai',
  花: 'hua',
  生: 'sheng',
  煎: 'jian',
  炸: 'zha',
  煮: 'zhu',
  蒸: 'zheng',
  炖: 'dun',
  焖: 'men',
  烤: 'kao',
  拌: 'ban',
  凉: 'liang',
  汤: 'tang',
  饭: 'fan',
  米: 'mi',
  粉: 'fen',
  条: 'tiao',
  饼: 'bing',
  丝: 'si',
  片: 'pian',
  块: 'kuai',
  丁: 'ding',
  鱼: 'yu',
  虾: 'xia',
  蟹: 'xie',
  猪: 'zhu',
  羊: 'yang',
  鸭: 'ya',
  鹅: 'e',
  排: 'pai',
  骨: 'gu',
  腿: 'tui',
  胸: 'xiong',
  翅: 'chi',
  皮: 'pi',
  胡: 'hu',
  萝: 'luo',
  卜: 'bo',
  洋: 'yang',
  芹: 'qin',
  莲: 'lian',
  藕: 'ou',
  菇: 'gu',
  蘑: 'mo',
  笋: 'sun',
  瓜: 'gua',
  南: 'nan',
  冬: 'dong',
  苹: 'ping',
  果: 'guo',
  橙: 'cheng',
  柠: 'ning',
  檬: 'meng',
  芒: 'mang',
  燕: 'yan',
  麦: 'mai',
  玉: 'yu',
  芝: 'zhi',
  麻: 'ma',
  酱: 'jiang',
  油: 'you',
  盐: 'yan',
  糖: 'tang',
  醋: 'cu',
  料: 'liao',
  酒: 'jiu',
  步: 'step',
  骤: 'zhou',
  封: 'feng',
  图: 'tu',
  用: 'yong',
  户: 'hu',
  谱: 'pu',
  帖: 'post',
  子: 'zi',
};

export interface StorageKeyOptions {
  folder: string;
  originalName?: string;
  label?: string;
  prefix?: string;
  ext?: string;
  segments?: Array<string | number | undefined | null>;
  stepIndex?: number;
  index?: number;
  now?: Date;
}

function normalizeText(value: string): string {
  let text = value.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // Keep the original value when it is not URI encoded.
  }

  return text
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/\.[a-z0-9]{1,8}$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function toStorageSlug(value: unknown, fallback = 'image', maxLength = 72): string {
  const normalized = normalizeText(String(value || ''));
  const tokens: string[] = [];
  let current = '';

  const flush = () => {
    if (current) {
      tokens.push(current);
      current = '';
    }
  };

  for (const char of normalized) {
    if (/[a-zA-Z0-9]/.test(char)) {
      current += char.toLowerCase();
      continue;
    }

    const mapped = PINYIN_MAP[char];
    if (mapped) {
      flush();
      tokens.push(mapped);
      continue;
    }

    if (/[\u4e00-\u9fff]/.test(char)) {
      flush();
      continue;
    }

    flush();
  }

  const slug = tokens
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');

  return slug || fallback;
}

export function getImageExtension(originalName?: string, fallback = '.jpg'): string {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  const cleanFallback = fallback.startsWith('.') ? fallback.toLowerCase() : `.${fallback.toLowerCase()}`;
  return IMAGE_EXTENSIONS.has(cleanFallback) ? cleanFallback : '.jpg';
}

export function cleanStorageFolder(folder: string): string {
  return String(folder || 'tmp')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => toStorageSlug(part, 'resource', 48))
    .filter(Boolean)
    .join('/');
}

export function buildStorageKey(options: StorageKeyOptions): string {
  const now = options.now || new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const random = Math.random().toString(36).slice(2, 8);
  const ext = getImageExtension(options.originalName || options.ext, options.ext || '.jpg');
  const label = options.label || options.originalName || options.prefix || 'image';
  const prefix = options.prefix ? toStorageSlug(options.prefix, 'image', 32) : '';
  const slug = toStorageSlug(label, prefix || 'image', 72);
  const index =
    options.stepIndex !== undefined
      ? `step-${String(options.stepIndex + 1).padStart(2, '0')}`
      : options.index !== undefined
        ? `img-${String(options.index + 1).padStart(2, '0')}`
        : '';

  const filename = [prefix, index, slug, `${date}-${time}`, random]
    .filter(Boolean)
    .join('_')
    .replace(/_+/g, '_');

  const segments = (options.segments || [])
    .map((segment) => toStorageSlug(segment, 'resource', 48))
    .filter(Boolean);

  return path.posix.join(cleanStorageFolder(options.folder), ...segments, `${filename}${ext}`);
}
