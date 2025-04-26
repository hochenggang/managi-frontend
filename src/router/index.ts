import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import CmdsView from '../views/CmdsView.vue'
import XtremView from '../views/XtremView.vue'


const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'cmds',
      component: CmdsView,
    },
    {
      path: '/xterm',
      name: 'xterm',
      component: XtremView,
    },

  ],
})

export default router
