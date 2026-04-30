import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

const defaultSettings = {
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

function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSettings(): typeof defaultSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return { ...defaultSettings };
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const loaded = JSON.parse(raw);
    return { ...defaultSettings, ...loaded };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(settings: typeof defaultSettings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

class SettingsStore {
  private settings: typeof defaultSettings;

  constructor() {
    this.settings = loadSettings();
  }

  getAll() {
    return { ...this.settings };
  }

  get<K extends keyof typeof defaultSettings>(key: K) {
    return { ...this.settings[key] };
  }

  set<K extends keyof typeof defaultSettings>(key: K, data: Partial<(typeof defaultSettings)[K]>) {
    this.settings[key] = { ...this.settings[key], ...data } as (typeof defaultSettings)[K];
    saveSettings(this.settings);
  }
}

export const settingsStore = new SettingsStore();
