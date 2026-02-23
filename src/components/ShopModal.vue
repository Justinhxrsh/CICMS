<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-card shop-modal">
      <div class="npc-header">
        <div class="npc-avatar"><span class="emoji">🛒</span></div>
        <div class="npc-info">
          <h3>{{ interactingWith.name }}'s Shop</h3>
          <p class="npc-type">Merchant</p>
        </div>
        <div class="player-gold">🪙 {{ gold.toLocaleString() }}g</div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="shop-content">
        <div class="shop-grid">
          <div v-for="item in interactingWith.shopItems" :key="item.id" class="shop-item">
            <div class="item-icon">{{ getEmoji(item.defKey) }}</div>
            <div class="item-details">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">{{ item.price }}g</div>
            </div>
            <button class="buy-btn" @click="buyItem(item)">Buy</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import wsService from '../services/websocket';

export default {
  name: 'ShopModal',
  computed: {
    ...mapState('world', ['interactingWith']),
    ...mapState('player', ['gold']),
  },
  methods: {
    close() {
      this.$store.dispatch('world/closeInteraction');
    },
    getEmoji(defKey) {
      // In a real app we'd have an item def dictionary
      const emojis = {
        'IRON_ORE': '🪨',
        'GOLD_ORE': '✨',
        'BREAD': '🍞',
        'SWORD': '⚔️',
        'SHIELD': '🛡️',
        'AXE': '🪓',
        'PICKAXE': '⛏️',
      };
      return emojis[defKey] || '📦';
    },
    buyItem(item) {
      wsService.action('BUY_ITEM', {
        targetId: this.interactingWith.id,
        itemId: item.defKey,
        quantity: 1
      });
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 200, 50, 0.3);
  border-radius: 12px;
  width: 500px;
  max-height: 80vh;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
}

.npc-header {
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 200, 50, 0.1);
  position: relative;
}

.npc-avatar {
  width: 48px;
  height: 48px;
  background: rgba(255, 200, 50, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.npc-info { flex: 1; }
.npc-info h3 { margin: 0; color: #f5d44a; font-size: 18px; }
.npc-type { margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 10px; text-transform: uppercase; }

.player-gold {
  color: #f5d44a;
  font-weight: 700;
  font-size: 14px;
  padding: 4px 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 20px;
  margin-right: 30px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
}

.shop-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.shop-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.shop-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 200, 50, 0.2);
}

.item-icon { font-size: 28px; }

.item-details { flex: 1; }
.item-name { font-weight: 600; color: #fff; }
.item-price { font-size: 13px; color: #f5d44a; }

.buy-btn {
  padding: 6px 16px;
  background: rgba(245, 212, 74, 0.1);
  border: 1px solid #f5d44a;
  border-radius: 4px;
  color: #f5d44a;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-btn:hover {
  background: #f5d44a;
  color: #1a0a00;
}
</style>
