import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.scss'

// Apply saved theme on load
const savedTheme = localStorage.getItem('airecipe-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

const app = createApp(App)
app.use(router)
app.mount('#app')
