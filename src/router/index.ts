import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../pages/home/Home.vue";

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
   routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    },
   ]

})