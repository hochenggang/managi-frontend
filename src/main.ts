import './assets/main.css'

import { createApp } from 'vue'


import App from './App.vue'
import router from './router'
import Notifications from '@kyvg/vue3-notification'

const app = createApp(App)
app.directive('focus', {
    mounted(el) {
        el.focus(); // 自动聚焦
    }
});

app.use(router)
app.use(Notifications)

app.mount('#app')
