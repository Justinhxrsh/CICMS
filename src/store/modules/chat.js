const state = {
    messages: [],
    actionLogs: [],
    maxMessages: 100,
};

const mutations = {
    ADD_MESSAGE(state, msg) {
        state.messages.push(msg);
        if (state.messages.length > state.maxMessages) {
            state.messages.shift();
        }
    },
    ADD_ACTION_LOG(state, { message, type = 'info' }) {
        state.actionLogs.push({
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString(),
        });
        if (state.actionLogs.length > 50) {
            state.actionLogs.shift();
        }
    },
    SET_HISTORY(state, messages) {
        state.messages = messages || [];
    },
};

const actions = {
    addMessage({ commit }, msg) {
        commit('ADD_MESSAGE', msg);
    },
    addActionLog({ commit }, payload) {
        if (typeof payload === 'string') {
            commit('ADD_ACTION_LOG', { message: payload });
        } else {
            commit('ADD_ACTION_LOG', payload);
        }
    },
    setChatHistory({ commit }, messages) {
        commit('SET_HISTORY', messages);
    },
};

export default {
    namespaced: true,
    state,
    getters: {},
    mutations,
    actions,
};
