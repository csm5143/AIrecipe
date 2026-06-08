import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';
import {
  canAccessRoute,
  ROLE_PERMISSION_MAP,
  getAccessDeniedMessage,
  type Role,
  type PermissionModule,
} from '@/utils/permissions';

export { type Role, type PermissionModule };

export function usePermission() {
  const userStore = useUserStore();

  const currentRole = computed<Role | undefined>(
    () => userStore.profile?.role as Role | undefined
  );

  const isSuperAdmin = computed(() => currentRole.value === 'SUPER_ADMIN');
  const isAdmin = computed(() => currentRole.value === 'ADMIN');
  const isEditor = computed(() => currentRole.value === 'EDITOR');
  const isAuditor = computed(() => currentRole.value === 'AUDITOR');

  function canAccess(path: string): boolean {
    return canAccessRoute(currentRole.value, path);
  }

  function canAccessModule(module: PermissionModule): boolean {
    if (module === 'ALL') return true;
    if (!currentRole.value) return false;
    return ROLE_PERMISSION_MAP[currentRole.value].includes(module);
  }

  return {
    currentRole,
    isSuperAdmin,
    isAdmin,
    isEditor,
    isAuditor,
    canAccess,
    canAccessModule,
    getAccessDeniedMessage,
  };
}
