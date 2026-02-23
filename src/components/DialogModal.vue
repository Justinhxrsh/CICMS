<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-card dialog-modal">
      <div class="npc-header">
        <div class="npc-avatar">
          <span class="emoji">{{ interactingWith.emoji }}</span>
        </div>
        <div class="npc-info">
          <h3>{{ interactingWith.name }}</h3>
          <p class="npc-type">{{ capitalize(interactingWith.type) }}</p>
        </div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-body">
        <div class="message">
          {{ currentDialog }}
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="close" class="action-btn">Farewell</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'DialogModal',
  computed: {
    ...mapState('world', ['interactingWith']),
    currentDialog() {
      if (!this.interactingWith) return '';
      // Simple random dialog for now
      const dialogs = [
        "Welcome hunter. What brings you to these lands?",
        "Beautiful day, isn't it?",
        "Watch your step, the wilderness can be dangerous.",
        "Have you seen the golden mountains to the north?",
      ];
      return dialogs[Math.floor(Math.random() * dialogs.length)];
    }
  },
  methods: {
    close() {
      this.$store.dispatch('world/closeInteraction');
    },
    capitalize(s) {
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
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
  width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  animation: modalPop 0.3s ease-out;
}

@keyframes modalPop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
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
}

.emoji { font-size: 32px; }

.npc-info h3 { margin: 0; color: #f5d44a; font-size: 18px; }
.npc-type { margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.5;
}

.close-btn:hover { opacity: 1; }

.dialog-body {
  padding: 24px;
  min-height: 100px;
}

.message {
  color: #fff;
  font-size: 15px;
  line-height: 1.6;
  font-style: italic;
}

.dialog-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.2);
}

.action-btn {
  padding: 8px 20px;
  background: #f5d44a;
  border: none;
  border-radius: 6px;
  color: #1a0a00;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 212, 74, 0.3);
}
</style>
