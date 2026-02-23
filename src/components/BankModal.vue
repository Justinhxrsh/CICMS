<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-card bank-modal">
      <div class="npc-header">
        <div class="npc-avatar">🏦</div>
        <div class="npc-info">
          <h3>Royal Bank of Delaford</h3>
          <p class="npc-type">Safe Storage</p>
        </div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="bank-tabs">
        <button :class="{ active: tab === 'deposit' }" @click="tab = 'deposit'">Deposit</button>
        <button :class="{ active: tab === 'withdraw' }" @click="tab = 'withdraw'">Withdraw</button>
      </div>

      <div class="bank-content">
        <!-- Simplified for now: just list items -->
        <div class="item-grid" v-if="tab === 'deposit'">
          <div v-for="(item, idx) in inventory" :key="idx" class="bank-slot" @click="deposit(item)">
            <span class="emoji">{{ item.emoji }}</span>
            <span class="qty" v-if="item.quantity > 1">{{ item.quantity }}</span>
          </div>
          <div v-if="inventory.length === 0" class="empty">Your inventory is empty.</div>
        </div>

        <div class="item-grid" v-else>
          <div v-for="(item, idx) in bank" :key="idx" class="bank-slot" @click="withdraw(item)">
            <span class="emoji">{{ item.emoji }}</span>
            <span class="qty" v-if="item.quantity > 1">{{ item.quantity }}</span>
          </div>
          <div v-if="bank.length === 0" class="empty">Your bank is empty.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import wsService from '../services/websocket';

export default {
  name: 'BankModal',
  data() {
    return { tab: 'deposit' };
  },
  computed: {
    ...mapState('inventory', { inventory: 'items', bank: 'bank' }),
    ...mapState('world', ['interactingWith']),
  },
  methods: {
    close() {
      this.$store.dispatch('world/closeInteraction');
    },
    deposit(item) {
      wsService.bankAction(this.interactingWith.id, 'DEPOSIT', item.id, 1);
    },
    withdraw(item) {
      wsService.bankAction(this.interactingWith.id, 'WITHDRAW', item.id, 1);
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
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
  width: 450px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
}

.npc-header {
  padding: 16px;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 200, 50, 0.1);
}

.npc-avatar {
  font-size: 32px;
}

.npc-info h3 { margin: 0; color: #f5d44a; }
.npc-type { margin: 0; color: rgba(255,255,255,0.4); font-size: 11px; }

.bank-tabs {
  display: flex;
  background: rgba(0,0,0,0.2);
}

.bank-tabs button {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  font-weight: 600;
}

.bank-tabs button.active {
  color: #f5d44a;
  border-bottom-color: #f5d44a;
  background: rgba(245, 212, 74, 0.05);
}

.bank-content {
  padding: 20px;
  height: 300px;
  overflow-y: auto;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.bank-slot {
  aspect-ratio: 1;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

.bank-slot:hover {
  border-color: #f5d44a;
  background: rgba(245, 212, 74, 0.05);
}

.emoji { font-size: 24px; }
.qty { position: absolute; bottom: 2px; right: 4px; font-size: 10px; color: #fff; }

.empty {
  grid-column: span 6;
  text-align: center;
  color: rgba(255,255,255,0.3);
  padding-top: 40px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  margin-left: auto;
}
</style>
