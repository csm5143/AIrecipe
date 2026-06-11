import { reactive } from 'vue';

export interface UserPreferences {
  collapseSidebar: boolean;
  pageSize: 10 | 20 | 50;
  dateFormat: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'DD-MM-YYYY';
  themeMode: 'light' | 'dark';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  collapseSidebar: false,
  pageSize: 20,
  dateFormat: 'YYYY-MM-DD',
  themeMode: 'light',
};

const STORAGE_KEY = 'userPreferences';

// 内存中的响应式状态（直接返回给调用方，支持 v-model）
const preferencesState = reactive<UserPreferences>({ ...DEFAULT_PREFERENCES });

// 初始化：从 localStorage 读取
function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } as UserPreferences;
    }
  } catch {}
  return { ...DEFAULT_PREFERENCES };
}

// 初始化
Object.assign(preferencesState, loadPreferences());

/**
 * 全局共享的偏好设置 composable
 * 所有页面使用此 hook 获取/更新偏好，数据来源和保存目标均为 localStorage
 */
export function usePreferences() {
  function updatePreferences(partial: Partial<UserPreferences>) {
    Object.assign(preferencesState, partial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...preferencesState }));
    applyTheme(preferencesState.themeMode);
  }

  /** 将 pageSize 转成 el-pagination 组件要求的 number 类型 */
  function defaultPageSize(): number {
    return Number(preferencesState.pageSize);
  }

  /** 根据用户偏好格式化日期时间 */
  function formatDateTime(ts: number | string | Date | null | undefined): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return dayjsFormat(d, preferencesState.dateFormat, true);
  }

  /** 根据用户偏好格式化日期（不含时间） */
  function formatDate(ts: number | string | Date | null | undefined): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return dayjsFormat(d, preferencesState.dateFormat, false);
  }

  return {
    /** 响应式状态，profile 页直接 v-model 绑定 */
    preferences: preferencesState,
    updatePreferences,
    defaultPageSize,
    formatDateTime,
    formatDate,
  };
}

export function applyTheme(mode: UserPreferences['themeMode']) {
  document.documentElement.dataset.theme = mode;
}

applyTheme(preferencesState.themeMode);

/**
 * dayjs 内部格式化函数（不在全局暴露，仅供 composable 内部使用）
 */
function dayjsFormat(
  date: Date,
  fmt: UserPreferences['dateFormat'],
  includeTime: boolean,
): string {
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');

  let result: string;
  switch (fmt) {
    case 'YYYY/MM/DD': result = `${y}/${M}/${d}`; break;
    case 'DD-MM-YYYY': result = `${d}-${M}-${y}`; break;
    default:           result = `${y}-${M}-${d}`; break; // YYYY-MM-DD
  }

  if (includeTime) {
    result += ` ${h}:${m}:${s}`;
  }
  return result;
}
