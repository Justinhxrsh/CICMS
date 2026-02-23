const state = {
    items: [],       // Player inventory
    equipment: {
        head: null,
        chest: null,
        legs: null,
        feet: null,
        weapon: null,
        offhand: null,
    },
    bank: [],
};

const getters = {
    inventoryCount: (state) => state.items.length,
    inventoryFull: (state) => state.items.length >= 28,
    equippedItem: (state) => (slot) => state.equipment[slot],
    hasItem: (state) => (defKey) => state.items.some(i => i.defKey === defKey),
    hasTool: (state) => (toolName) => {
        return state.items.some(i => i.defKey === toolName.toUpperCase()) ||
            Object.values(state.equipment).some(i => i && i.defKey === toolName.toUpperCase());
    },
};

const mutations = {
    SET_INVENTORY(state, items) {
        state.items = items || [];
    },
    SET_EQUIPMENT(state, equipment) {
        state.equipment = equipment || state.equipment;
    },
    SET_BANK(state, bank) {
        state.bank = bank || [];
    },
    UPDATE_INVENTORY(state, { items, equipment, bank }) {
        if (items !== undefined) state.items = items;
        if (equipment !== undefined) state.equipment = equipment;
        if (bank !== undefined) state.bank = bank;
    },
};

const actions = {
    updateInventory({ commit }, data) {
        commit('UPDATE_INVENTORY', data);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
