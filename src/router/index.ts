import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import ManageView from '../views/ManageView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'manage',
      component: ManageView,
    },
  ],
})

export default router
