import { prisma } from '../../lib/prisma';

type SettingCategory = 'site' | 'seo' | 'legal' | 'security' | 'email';

const defaultValues: Record<SettingCategory, Record<string, string | number | boolean | string[]>> = {
  site: {
    siteName: 'AIRecipe',
    siteDescription: 'AIRecipe - 您的智能食谱助手',
    logo: '',
    favicon: '',
  },
  seo: {
    title: 'AIRecipe - 智能食谱推荐平台',
    keywords: '食谱,美食,烹饪,健康饮食,AI推荐',
    description: 'AIRecipe 提供智能食谱推荐、AI食材识别、健康饮食管理等功能的综合平台。',
  },
  legal: {
    icp: '',
    psbe: '',
    copyright: '© 2024 AIRecipe 版权所有',
    company: '',
    phone: '',
  },
  security: {
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordRequirements: ['minLength', 'number'],
    enableOperationLog: true,
  },
  email: {
    smtpHost: '',
    smtpPort: 465,
    encryption: 'ssl',
    fromEmail: '',
    fromName: 'AIRecipe',
    username: '',
    password: '',
  },
};

function parseValue(key: string, raw: string | null): string | number | boolean | string[] {
  if (raw === null || raw === '') {
    const def = Object.values(defaultValues).flatMap(v => Object.entries(v));
    const found = def.find(([k]) => k === key);
    return found ? found[1] : '';
  }
  const boolMatch = raw.match(/^(true|false)$/i);
  if (boolMatch !== null) return boolMatch[0].toLowerCase() === 'true';
  const numMatch = raw.match(/^-?\d+(\.\d+)?$/);
  if (numMatch !== null) return parseFloat(numMatch[0]);
  try { return JSON.parse(raw); } catch { return raw; }
}

function serializeValue(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
}

class SettingsStore {
  async ensureInitialized(): Promise<void> {
    const count = await prisma.systemSetting.count();
    if (count > 0) return;

    const seeds: Array<{ category: string; key: string; value: string; description: string }> = [
      // site
      { category: 'site', key: 'siteName',        value: 'AIRecipe',                           description: '网站名称' },
      { category: 'site', key: 'siteDescription', value: 'AIRecipe - 您的智能食谱助手',         description: '网站描述' },
      { category: 'site', key: 'logo',            value: '',                                    description: '网站Logo' },
      { category: 'site', key: 'favicon',         value: '',                                   description: '网站图标' },
      // seo
      { category: 'seo',  key: 'title',       value: 'AIRecipe - 智能食谱推荐平台',                   description: 'SEO标题' },
      { category: 'seo',  key: 'keywords',   value: '食谱,美食,烹饪,健康饮食,AI推荐',                description: 'SEO关键字' },
      { category: 'seo',  key: 'description', value: 'AIRecipe 提供智能食谱推荐、AI食材识别、健康饮食管理等功能的综合平台。', description: 'SEO描述' },
      // legal
      { category: 'legal', key: 'icp',       value: '',                         description: 'ICP备案号' },
      { category: 'legal', key: 'psbe',      value: '',                         description: '公安网安备号' },
      { category: 'legal', key: 'copyright', value: '© 2024 AIRecipe 版权所有', description: '版权声明' },
      { category: 'legal', key: 'company',   value: '',                        description: '公司名称' },
      { category: 'legal', key: 'phone',     value: '',                        description: '联系电话' },
      // security
      { category: 'security', key: 'sessionTimeout',      value: '60',                        description: '会话超时(分钟)' },
      { category: 'security', key: 'maxLoginAttempts',   value: '5',                         description: '最大登录失败次数' },
      { category: 'security', key: 'passwordRequirements', value: '["minLength","number"]',   description: '密码要求' },
      { category: 'security', key: 'enableOperationLog',  value: 'true',                       description: '启用操作日志' },
      // email
      { category: 'email', key: 'smtpHost',   value: '',         description: 'SMTP主机' },
      { category: 'email', key: 'smtpPort',   value: '465',      description: 'SMTP端口' },
      { category: 'email', key: 'encryption', value: 'ssl',      description: '加密方式' },
      { category: 'email', key: 'fromEmail',  value: '',         description: '发件邮箱' },
      { category: 'email', key: 'fromName',   value: 'AIRecipe', description: '发件人名称' },
      { category: 'email', key: 'username',  value: '',         description: '邮箱用户名' },
      { category: 'email', key: 'password',  value: '',         description: '邮箱密码' },
    ];

    await prisma.systemSetting.createMany({ data: seeds });
  }

  private async loadCategory(category: SettingCategory): Promise<Record<string, string | number | boolean | string[]>> {
    const rows = await prisma.systemSetting.findMany({ where: { category } });
    const result: Record<string, string | number | boolean | string[]> = { ...defaultValues[category] };
    for (const row of rows) {
      result[row.key] = parseValue(row.key, row.value);
    }
    return result;
  }

  async getAll(): Promise<Record<SettingCategory, Record<string, string | number | boolean | string[]>>> {
    await this.ensureInitialized();
    const categories: SettingCategory[] = ['site', 'seo', 'legal', 'security', 'email'];
    const result = {} as Record<SettingCategory, Record<string, string | number | boolean | string[]>>;
    await Promise.all(categories.map(async (cat) => {
      result[cat] = await this.loadCategory(cat);
    }));
    return result;
  }

  async get<K extends SettingCategory>(key: K): Promise<Record<string, string | number | boolean | string[]>> {
    await this.ensureInitialized();
    return this.loadCategory(key);
  }

  async set<K extends SettingCategory>(
    category: K,
    data: Partial<Record<string, string | number | boolean | string[]>>
  ): Promise<void> {
    await this.ensureInitialized();
    await Promise.all(
      Object.entries(data).map(async ([k, v]) => {
        await prisma.systemSetting.upsert({
          where: { category_key: { category, key: k } },
          update: { value: serializeValue(v) },
          create: { category, key: k, value: serializeValue(v) },
        });
      })
    );
  }
}

export const settingsStore = new SettingsStore();
