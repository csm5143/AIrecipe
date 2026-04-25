import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/home/index.vue')
    },
    {
      path: '/download',
      name: 'Download',
      component: () => import('@/views/download/index.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
