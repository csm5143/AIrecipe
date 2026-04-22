import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store/modules/user';

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
        meta: { title: '食谱管理', icon: 'Food' },
      },
      {
        path: 'recipes/create',
        name: 'RecipeCreate',
        component: () => import('@/views/recipe/create.vue'),
        meta: { title: '创建食谱', icon: 'Plus' },
      },
      {
        path: 'recipes/:id/edit',
        name: 'RecipeEdit',
        component: () => import('@/views/recipe/edit.vue'),
        meta: { title: '编辑食谱', icon: 'Edit' },
      },
      {
        path: 'ingredients',
        name: 'Ingredients',
        component: () => import('@/views/ingredient/index.vue'),
        meta: { title: '食材管理', icon: 'FoodComponent' },
      },
      {
        path: 'collections',
        name: 'Collections',
        component: () => import('@/views/collection/index.vue'),
        meta: { title: '收藏管理', icon: 'Collection' },
      },
      {
        path: 'feedbacks',
        name: 'Feedbacks',
        component: () => import('@/views/feedback/index.vue'),
        meta: { title: '反馈管理', icon: 'ChatDotRound' },
      },
      {
        path: 'content',
        name: 'Content',
        component: () => import('@/views/content/index.vue'),
        meta: { title: '内容运营', icon: 'TrendCharts' },
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

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth !== false) {
    const userStore = useUserStore();
    if (!userStore.token) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
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
