<template>
  <div class="inventory">
    <div class="inventory-grid">
      <div
        v-for="n in 28"
        :key="n"
        class="slot"
        @contextmenu.prevent="showSlotMenu(n-1, $event)"
      >
        <div v-if="items[n-1]" class="item" :title="items[n-1].name">
          <div class="item-emoji">{{ items[n-1].emoji }}</div>
          <div v-if="items[n-1].quantity > 1" class="item-qty">{{ items[n-1].quantity }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import wsService from '../services/websocket';

export default {
  name: 'Inventory',
  computed: {
    ...mapState('inventory', ['items']),
  },
  methods: {
    showSlotMenu(index, event) {
      const item = this.items[index];
      if (!item) return;

      // This would normally trigger the ContextMenu component
      // For now, we'll just emit an event or call service directly if it's simple
      this.$root.$emit('show-context-menu', {
        event,
        type: 'item',
        item,
        index
      });
    },
  },
};
</script>

<style scoped>
.inventory {
  padding: 10px;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.slot {
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 200, 50, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.2s, border-color 0.2s;
  cursor: pointer;
}

.slot:hover {
  background: rgba(255, 200, 50, 0.05);
  border-color: rgba(255, 200, 50, 0.3);
}

.item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.item-emoji {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.item-qty {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px #000;
}
</style>
