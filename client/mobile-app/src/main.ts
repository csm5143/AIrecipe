import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Taro from '@tarojs/taro';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(Taro);

export default app;
