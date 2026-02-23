import Vue from 'vue';
import VueRouter from 'vue-router';
import Login from '../views/Login.vue';
import Game from '../views/Game.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login,
    },
    {
        path: '/game',
        name: 'Game',
        component: Game,
        meta: { requiresAuth: true },
    },
    {
        path: '*',
        redirect: '/',
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
        const savedPlayer = localStorage.getItem('delaford_player');
        if (!savedPlayer) {
            next('/');
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;
