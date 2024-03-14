import { createRouter, createWebHashHistory } from "vue-router";
import routerMap from './constantRouterMap'


let router = createRouter({
  history: createWebHashHistory(),
  routes: routerMap
});

export default router
