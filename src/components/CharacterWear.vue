<template>
  <div class="equipment">
    <div class="equipment-layout">
      <div class="equip-row">
        <EquipSlot slot-name="head" :item="equipment.head" icon="🪖" />
      </div>
      <div class="equip-row">
        <EquipSlot slot-name="offhand" :item="equipment.offhand" icon="🛡️" />
        <EquipSlot slot-name="chest" :item="equipment.chest" icon="👕" />
        <EquipSlot slot-name="weapon" :item="equipment.weapon" icon="⚔️" />
      </div>
      <div class="equip-row">
        <EquipSlot slot-name="legs" :item="equipment.legs" icon="👖" />
      </div>
      <div class="equip-row">
        <EquipSlot slot-name="feet" :item="equipment.feet" icon="👞" />
      </div>
    </div>

    <div class="stats-summary" v-if="player">
      <div class="stat"><span class="label">ATK:</span> <span class="val">{{ player.attack }}</span></div>
      <div class="stat"><span class="label">DEF:</span> <span class="val">{{ player.defense }}</span></div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import wsService from '../services/websocket';

const EquipSlot = {
  props: ['slotName', 'item', 'icon'],
  template: `
    <div class="slot" :class="{ occupied: !!item }" @contextmenu.prevent="onRightClick">
      <div v-if="item" class="item" :title="item.name">
        {{ item.emoji }}
      </div>
      <div v-else class="placeholder">{{ icon }}</div>
    </div>
  `,
  methods: {
    onRightClick(e) {
      if (!this.item) return;
      this.$root.$emit('show-context-menu', {
        event: e,
        type: 'equipment',
        slot: this.slotName,
        item: this.item
      });
    }
  }
};

export default {
  name: 'CharacterWear',
  components: { EquipSlot },
  computed: {
    ...mapState('inventory', ['equipment']),
    ...mapState('player', { player: state => state }),
  },
};
</script>

<style scoped>
.equipment {
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.equipment-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.equip-row {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.slot {
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 200, 50, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.slot:hover {
  border-color: rgba(255, 200, 50, 0.4);
  background: rgba(255, 200, 50, 0.05);
}

.slot.occupied {
  background: rgba(255, 200, 50, 0.1);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
}

.placeholder {
  opacity: 0.2;
  filter: grayscale(1);
}

.stats-summary {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.label { color: rgba(255, 255, 255, 0.4); }
.val { color: #f5d44a; font-weight: 700; margin-left: 4px; }
</style>
