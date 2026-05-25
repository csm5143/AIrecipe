import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import { canAccessRoute, getAccessDeniedMessage } from '@/utils/permissions';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'Odometer' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'recipes',
        name: 'Recipes',
        component: () => import('@/views/recipe/index.vue'),
        meta: { title: '菜谱管理', icon: 'Food' },
      },
      {
        path: 'recipes/featured',
        name: 'FeaturedRecipes',
        component: () => import('@/views/featured/index.vue'),
        meta: { title: '精选菜谱', icon: 'Star' },
      },
      {
        path: 'recipes/hot',
        name: 'HotRecipes',
        component: () => import('@/views/hot-recipes/index.vue'),
        meta: { title: '热门菜谱', icon: 'TrendCharts' },
      },
      {
        path: 'recipes/create',
        name: 'RecipeCreate',
        component: () => import('@/views/recipe/create.vue'),
        meta: { title: '创建菜谱', icon: 'Plus' },
      },
      {
        path: 'recipes/:id/edit',
        name: 'RecipeEdit',
        component: () => import('@/views/recipe/edit.vue'),
        meta: { title: '编辑菜谱', icon: 'Edit' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人设置', icon: 'UserFilled' },
      },
      {
        path: 'ingredients',
        name: 'Ingredients',
        component: () => import('@/views/ingredient/index.vue'),
        meta: { title: '食材管理', icon: 'FoodComponent' },
      },
      {
        path: 'feedbacks',
        name: 'Feedbacks',
        component: () => import('@/views/feedback/index.vue'),
        meta: { title: '反馈管理', icon: 'ChatDotRound' },
      },
      {
        path: 'ai-scans',
        name: 'AiScans',
        component: () => import('@/views/ai-scan/index.vue'),
        meta: { title: 'AI 扫描记录', icon: 'Cpu' },
      },
      {
        path: 'recipe-audit',
        name: 'RecipeAudit',
        component: () => import('@/views/recipe-audit/index.vue'),
        meta: { title: '菜谱审核', icon: 'Stamp' },
      },
      {
        path: 'recycle',
        name: 'Recycle',
        component: () => import('@/views/recycle/index.vue'),
        meta: { title: '回收站', icon: 'Delete' },
      },
      {
        path: 'content',
        name: 'Content',
        component: () => import('@/views/content/index.vue'),
        meta: { title: '内容运营', icon: 'TrendCharts' },
      },
      {
        path: 'image-create',
        name: 'ImageCreate',
        component: () => import('@/views/content/ImageCreate.vue'),
        meta: { title: '图片创作', icon: 'Picture' },
      },
      {
        path: 'system',
        name: 'System',
        redirect: 'system/settings',
        meta: { title: '系统设置', icon: 'Setting' },
        children: [
          {
            path: 'settings',
            name: 'Settings',
            component: () => import('@/views/system/settings.vue'),
            meta: { title: '基础设置' },
          },
          {
            path: 'admin',
            name: 'AdminList',
            component: () => import('@/views/system/admin.vue'),
            meta: { title: '管理员' },
          },
          {
            path: 'operation-logs',
            name: 'OperationLogs',
            component: () => import('@/views/system/logs.vue'),
            meta: { title: '操作日志' },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth !== false) {
    const userStore = useUserStore();
    if (!userStore.token) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    // profile 未加载成功时先拉取（用 profileLoaded 防止重复请求）
    if (!userStore.profileLoaded) {
      try {
        await userStore.fetchProfile();
      } catch {
        // fetchProfile 内部已设置 profileLoaded
      }
      // 拉取后仍无 profile 说明 token 无效，退回登录
      if (!userStore.profile) {
        next({ name: 'Login' });
        return;
      }
    }

    const role = userStore.profile?.role;
    if (role && !canAccessRoute(role, to.path)) {
      ElMessage.error(getAccessDeniedMessage(to.path));
      next({ name: 'Dashboard' });
      return;
    }
  }

  if (to.name === 'Login') {
    const userStore = useUserStore();
    if (userStore.token) {
      next({ name: 'Dashboard' });
      return;
    }
  }

  next();
});

export default router;
