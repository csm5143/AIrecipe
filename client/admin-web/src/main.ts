import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { useUserStore } from './store/modules/user';
import './styles/index.scss';

const app = createApp(App);
const pinia = createPinia();

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });

router.isReady().then(async () => {
  app.mount('#app');

  // 路由就绪后初始化用户数据（静默降级，不阻塞页面渲染）
  const userStore = useUserStore();
  if (userStore.token) {
    try {
      await Promise.race([
        userStore.fetchProfile(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
    } catch {
      // API 不可用时静默降级，保留 token 不跳转登录页
    }
  }
});
