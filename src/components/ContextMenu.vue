<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: y + 'px', left: x + 'px' }"
    @mouseleave="hide"
  >
    <div class="menu-header" v-if="title">
      {{ title }}
    </div>
    <div class="menu-options">
      <button
        v-for="opt in options"
        :key="opt.label"
        @click="opt.action"
        class="menu-btn"
      >
        <span class="opt-label">{{ opt.label }}</span>
      </button>
      <button class="menu-btn cancel" @click="hide">
        <span class="opt-label">Cancel</span>
      </button>
    </div>
  </div>
</template>

<script>
import wsService from '../services/websocket';

export default {
  name: 'ContextMenu',
  data() {
    return {
      visible: false,
      x: 0,
      y: 0,
      title: '',
      options: [],
    };
  },
  mounted() {
    this.$root.$on('show-context-menu', this.show);
    window.addEventListener('click', this.hide);
  },
  beforeDestroy() {
    this.$root.$off('show-context-menu', this.show);
    window.removeEventListener('click', this.hide);
  },
  methods: {
    show({ event, type, item, npc, worldItem, slot, index, options }) {
      this.x = event.clientX;
      this.y = event.clientY;
      this.options = options || [];
      this.visible = true;

      // Adjust position if too close to edges
      this.$nextTick(() => {
        const menu = this.$el;
        if (!menu) return;
        if (this.x + menu.offsetWidth > window.innerWidth) this.x -= menu.offsetWidth;
        if (this.y + menu.offsetHeight > window.innerHeight) this.y -= menu.offsetHeight;
      });

      if (this.options.length > 0) {
        this.title = (npc && npc.name) || (item && item.name) || (worldItem && worldItem.name) || 'Actions';
        return;
      }

      if (type === 'item') {
        this.title = item.name;
        if (item.equippable) {
          this.options.push({ label: 'Equip', action: () => wsService.equip(item.id) });
        }
        if (item.consumable) {
          this.options.push({ label: 'Use', action: () => wsService.consume(item.id) });
        }
        this.options.push({ label: 'Drop', action: () => console.log('Drop not implemented') });
      } else if (type === 'equipment') {
        this.title = item.name;
        this.options.push({ label: 'Unequip', action: () => wsService.unequip(slot) });
      } else if (type === 'npc') {
        this.title = npc.name;
        this.options.push({ label: 'Talk', action: () => wsService.interact(npc.id, 'npc') });
        if (npc.isMerchant) {
          this.options.push({ label: 'Trade', action: () => wsService.interact(npc.id, 'npc') });
        }
        if (npc.isBanker) {
          this.options.push({ label: 'Bank', action: () => wsService.interact(npc.id, 'npc') });
        }
      } else if (type === 'worldItem') {
        this.title = worldItem.name;
        this.options.push({ label: 'Pick up', action: () => wsService.interact(worldItem.id, 'item') });
      } else if (type === 'resource') {
        this.title = worldItem.name;
        this.options.push({ label: 'Gather', action: () => wsService.gather(worldItem.id, worldItem.zoneKey) });
      }
    },
    hide() {
      this.visible = false;
    },
  },
};
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 2000;
  background: rgba(15, 10, 5, 0.95);
  border: 1px solid #f5d44a;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  min-width: 120px;
  overflow: hidden;
}

.menu-header {
  padding: 8px 12px;
  background: rgba(245, 212, 74, 0.1);
  border-bottom: 1px solid rgba(245, 212, 74, 0.2);
  color: #f5d44a;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu-options {
  display: flex;
  flex-direction: column;
}

.menu-btn {
  background: transparent;
  border: none;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.menu-btn:hover {
  background: rgba(245, 212, 74, 0.15);
  color: #f5d44a;
}

.menu-btn.cancel {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.4);
}

.menu-btn.cancel:hover {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.05);
}
</style>
