import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia';
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'

import App from './App.vue'
import router from './router'
import Notifications from '@kyvg/vue3-notification'
import i18n from './i18n';

const app = createApp(App)
const pinia = createPinia();

app.use(pinia)
app.use(router)
app.use(Notifications)
app.use(autoAnimatePlugin)
app.use(i18n)

app.mount('#app')
