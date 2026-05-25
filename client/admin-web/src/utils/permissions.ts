/**
 * 权限矩阵定义
 *
 * 角色说明：
 *   SUPER_ADMIN - 超级管理员，系统唯一，拥有关键操作权
 *   ADMIN      - 普通管理员，操作食谱/食材/反馈/内容，不能进入管理员管理
 *   EDITOR     - 编辑，只能操作食谱/食材（内容管理）
 *   AUDITOR    - 审核员，只能审核反馈（feedback）
 *
 * 模块说明（按路由路径前缀组织）：
 *   ALL        - 所有角色都可见
 *   recipe     - 菜谱管理（列表/创建/编辑）
 *   ingredient - 食材库
 *   collection - 收藏管理
 *   user       - 用户管理
 *   feedback   - 反馈管理
 *   content    - 内容运营
 *   recipe-audit - 菜谱审核
 *   recycle    - 回收站
 *   admin-manage - 管理员管理（系统设置下的管理员列表/操作日志）
 *   settings   - 基础设置
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUDITOR';

export type PermissionModule =
  | 'ALL'
  | 'recipe'
  | 'ingredient'
  | 'collection'
  | 'user'
  | 'feedback'
  | 'ai-scan'
  | 'content'
  | 'recipe-audit'
  | 'recycle'
  | 'admin-manage'
  | 'settings';

/** 路由路径 → 所属模块 */
export const ROUTE_MODULE_MAP: Record<string, PermissionModule> = {
  '/dashboard': 'ALL',
  '/profile': 'ALL',
  '/recipes': 'recipe',
  '/recipes/create': 'recipe',
  '/recipes/:id/edit': 'recipe',
  '/recipes/featured': 'recipe',
  '/recipes/hot': 'recipe',
  '/ingredients': 'ingredient',
  '/collections': 'collection',
  '/users': 'user',
  '/feedbacks': 'feedback',
  '/ai-scans': 'ai-scan',
  '/content': 'content',
  '/image-create': 'content',
  '/recipe-audit': 'recipe-audit',
  '/recycle': 'recycle',
  '/system': 'ALL',
  '/system/settings': 'settings',
  '/system/admin': 'admin-manage',
  '/system/operation-logs': 'admin-manage',
};

/** 哪些角色可以访问哪些模块 */
export const ROLE_PERMISSION_MAP: Record<Role, PermissionModule[]> = {
  SUPER_ADMIN: [
    'ALL', 'recipe', 'ingredient', 'collection',
    'user', 'feedback', 'ai-scan', 'content', 'recipe-audit',
    'recycle', 'admin-manage', 'settings',
  ],
  ADMIN: [
    'ALL', 'recipe', 'ingredient', 'collection',
    'feedback', 'ai-scan', 'content',
  ],
  EDITOR: [
    'ALL', 'recipe', 'ingredient', 'collection',
  ],
  AUDITOR: [
    'ALL', 'feedback', 'recipe-audit',
  ],
};

/** 路由路径 → 需要哪些角色之一才能访问（空数组 = 仅需登录） */
export const ROUTE_ROLE_GUARD: Record<string, Role[]> = {
  '/system/admin': ['SUPER_ADMIN'],
  '/system/operation-logs': ['SUPER_ADMIN'],
  '/system/settings': ['SUPER_ADMIN'],
  '/recycle': ['SUPER_ADMIN', 'ADMIN'],
  '/users': ['SUPER_ADMIN', 'ADMIN'],
  '/content': ['SUPER_ADMIN', 'ADMIN'],
};

/**
 * 根据路由路径判断当前角色是否有权访问
 */
export function canAccessRoute(role: Role | undefined, path: string): boolean {
  if (!role) return false;

  const allowedModules = ROLE_PERMISSION_MAP[role] || [];

  // 先走精确角色白名单
  for (const [guardPath, allowedRoles] of Object.entries(ROUTE_ROLE_GUARD)) {
    if (path.startsWith(guardPath)) {
      return allowedRoles.includes(role);
    }
  }

  // 再走模块矩阵
  for (const [routePrefix, module] of Object.entries(ROUTE_MODULE_MAP)) {
    if (path.startsWith(routePrefix)) {
      if (module === 'ALL') return true;
      return allowedModules.includes(module);
    }
  }

  // 未匹配任何已知路径，默认拒绝（新路由需要显式配置权限）
  return false;
}

/**
 * 根据路由路径获取该路由允许的角色列表（用于 403 提示）
 */
export function getAllowedRolesForRoute(path: string): Role[] | null {
  for (const [guardPath, roles] of Object.entries(ROUTE_ROLE_GUARD)) {
    if (path.startsWith(guardPath)) {
      return roles;
    }
  }
  return null;
}

const ROLE_NAMES: Record<Role, string> = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  EDITOR: '编辑',
  AUDITOR: '审核员',
};

export function getAccessDeniedMessage(path: string): string {
  const allowedRoles = getAllowedRolesForRoute(path);
  if (allowedRoles) {
    return `此页面仅「${allowedRoles.map(r => ROLE_NAMES[r]).join('、')}」角色可访问`;
  }
  return '您当前的角色无权访问此页面';
}
