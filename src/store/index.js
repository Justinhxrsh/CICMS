import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import player from './modules/player';
import inventory from './modules/inventory';
import world from './modules/world';
import chat from './modules/chat';

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        player,
        inventory,
        world,
        chat,
    },
    plugins: [
        createPersistedState({
            key: 'delaford_state',
            paths: ['player.name', 'player.id'],
        }),
    ],
});
