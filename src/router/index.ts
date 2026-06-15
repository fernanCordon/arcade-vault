import { createRouter, createWebHashHistory } from "vue-router";
import Biblioteca from "../pages/biblioteca/Biblioteca.vue";
import Salon from "../pages/salon/Salon.vue";
import Auth from "../pages/auth/Auth.vue";
import Detalle from "../pages/detalle/Detalle.vue";
import Reproductor from "../pages/reproductor/Reproductor.vue";

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../pages/home/Home.vue') },
    { path: '/games', name: 'biblioteca', component: Biblioteca },
    { path: '/salon', name: 'salon', component: Salon },
    { path: '/auth', name: 'auth', component: Auth },
    { path: '/juego/:id', name: 'detalle', component: Detalle },
    { path: '/jugar/:id', name: 'reproductor', component: Reproductor },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
