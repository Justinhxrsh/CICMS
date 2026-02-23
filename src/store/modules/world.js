const state = {
    otherPlayers: [],    // Other connected players
    npcs: [],
    worldItems: [],
    interactingWith: null,  // NPC being interacted with
    survival: {
        time: 1000,
        brightness: 1.0,
        dynamicTiles: {}
    }
};

const getters = {
    playerCount: (state) => state.otherPlayers.length + 1,
};

const mutations = {
    SET_WORLD_STATE(state, { players, npcs, items, survival }) {
        state.otherPlayers = players || [];
        state.npcs = npcs || [];
        state.worldItems = items || [];
        if (survival) state.survival = survival;
    },
    UPDATE_WORLD(state, { players, npcs, items, survival }) {
        if (players) {
            players.forEach(updated => {
                const idx = state.otherPlayers.findIndex(p => p.id === updated.id);
                if (idx !== -1) {
                    Object.assign(state.otherPlayers[idx], updated);
                }
            });
        }
        if (npcs) {
            npcs.forEach(updated => {
                const idx = state.npcs.findIndex(n => n.id === updated.id);
                if (idx !== -1) {
                    Object.assign(state.npcs[idx], updated);
                }
            });
        }
        if (items !== undefined) {
            state.worldItems = items;
        }
        if (survival) {
            state.survival = survival;
        }
    },
    ADD_PLAYER(state, player) {
        if (!state.otherPlayers.find(p => p.id === player.id)) {
            state.otherPlayers.push(player);
        }
    },
    REMOVE_PLAYER(state, playerId) {
        const idx = state.otherPlayers.findIndex(p => p.id === playerId);
        if (idx !== -1) state.otherPlayers.splice(idx, 1);
    },
    REMOVE_WORLD_ITEM(state, itemId) {
        const idx = state.worldItems.findIndex(i => i.id === itemId);
        if (idx !== -1) state.worldItems.splice(idx, 1);
    },
    SET_INTERACTING(state, npc) {
        state.interactingWith = npc;
    },
    CLEAR_INTERACTING(state) {
        state.interactingWith = null;
    },
};

const actions = {
    setWorldState({ commit }, worldState) {
        commit('SET_WORLD_STATE', worldState);
    },
    updateWorld({ commit }, update) {
        commit('UPDATE_WORLD', update);
    },
    playerJoined({ commit }, player) {
        commit('ADD_PLAYER', player);
    },
    playerLeft({ commit }, playerId) {
        commit('REMOVE_PLAYER', playerId);
    },
    removeWorldItem({ commit }, itemId) {
        commit('REMOVE_WORLD_ITEM', itemId);
    },
    interactWith({ commit }, npc) {
        commit('SET_INTERACTING', npc);
    },
    closeInteraction({ commit }) {
        commit('CLEAR_INTERACTING');
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
