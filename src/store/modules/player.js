const state = {
    id: null,
    name: '',
    col: 0,
    row: 0,
    x: 0,
    y: 0,
    direction: 'south',
    moving: false,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    gold: 0,
    attack: 5,
    defense: 2,
    skills: {
        mining: 0,
        fishing: 0,
        smithing: 0,
        cooking: 0,
        combat: 0,
    },
    connected: false,
    emotion: 'neutral',
};

const getters = {
    playerLevel: (state) => {
        const totalXp = Object.values(state.skills).reduce((a, b) => a + b, 0);
        return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);
    },
    skillLevel: (state) => (skill) => {
        const xp = state.skills[skill] || 0;
        return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    },
    healthPercent: (state) => {
        return state.maxHealth > 0 ? Math.round((state.health / state.maxHealth) * 100) : 0;
    },
    manaPercent: (state) => {
        return state.maxMana > 0 ? Math.round((state.mana / state.maxMana) * 100) : 0;
    },
};

const mutations = {
    SET_PLAYER(state, playerData) {
        Object.assign(state, playerData);
    },
    SET_CONNECTED(state, connected) {
        state.connected = connected;
    },
    SET_POSITION(state, { col, row, x, y, direction, moving }) {
        state.col = col ?? state.col;
        state.row = row ?? state.row;
        state.x = x ?? state.x;
        state.y = y ?? state.y;
        if (direction) state.direction = direction;
        if (moving !== undefined) state.moving = moving;
    },
    SET_STATS(state, stats) {
        if (stats.health !== undefined) state.health = stats.health;
        if (stats.maxHealth !== undefined) state.maxHealth = stats.maxHealth;
        if (stats.mana !== undefined) state.mana = stats.mana;
        if (stats.maxMana !== undefined) state.maxMana = stats.maxMana;
        if (stats.gold !== undefined) state.gold = stats.gold;
        if (stats.attack !== undefined) state.attack = stats.attack;
        if (stats.defense !== undefined) state.defense = stats.defense;
    },
    SET_SKILLS(state, skills) {
        state.skills = { ...state.skills, ...skills };
    },
    SET_EMOTION(state, emotion) {
        state.emotion = emotion;
    },
};

const actions = {
    initPlayer({ commit }, playerData) {
        commit('SET_PLAYER', playerData);
        commit('SET_CONNECTED', true);
    },
    updateStats({ commit }, stats) {
        commit('SET_STATS', stats);
    },
    updateSkills({ commit }, skills) {
        commit('SET_SKILLS', skills);
    },
    updatePosition({ commit }, posData) {
        commit('SET_POSITION', posData);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
