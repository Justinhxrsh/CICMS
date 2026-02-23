<template>
  <div class="hud panel">
    <div class="stat-bars">
      <!-- Health Bar -->
      <div class="stat-row">
        <div class="stat-icon">❤️</div>
        <div class="stat-bar-container">
          <div class="stat-bar health" :style="{ width: healthPercent + '%' }"></div>
          <div class="stat-text">{{ health }} / {{ maxHealth }}</div>
        </div>
      </div>

      <!-- Mana Bar -->
      <div class="stat-row">
        <div class="stat-icon">💧</div>
        <div class="stat-bar-container">
          <div class="stat-bar mana" :style="{ width: manaPercent + '%' }"></div>
          <div class="stat-text">{{ mana }} / {{ maxMana }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions/Stats could go here -->
    <div class="action-logs" ref="logBox">
      <div
        v-for="log in actionLogs"
        :key="log.id"
        class="log-entry"
        :class="log.type"
      >
        {{ log.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'HUD',
  computed: {
    ...mapState('player', ['health', 'maxHealth', 'mana', 'maxMana']),
    ...mapState('chat', ['actionLogs']),
    ...mapGetters('player', ['healthPercent', 'manaPercent']),
  },
  watch: {
    actionLogs() {
      this.$nextTick(() => {
        const box = this.$refs.logBox;
        if (box) box.scrollTop = box.scrollHeight;
      });
    },
  },
};
</script>

<style scoped>
.hud {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 200, 50, 0.1);
}

.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.stat-bar-container {
  flex: 1;
  height: 18px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9px;
  position: relative;
  overflow: hidden;
}

.stat-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.stat-bar.health {
  background: linear-gradient(to right, #e24a4a, #ff6b6b);
  box-shadow: 0 0 10px rgba(226, 74, 74, 0.4);
}

.stat-bar.mana {
  background: linear-gradient(to right, #4a90e2, #6db3ff);
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.4);
}

.stat-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  color: white;
}

.action-logs {
  height: 100px;
  overflow-y: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  gap: 4px;
  mask-image: linear-gradient(to bottom, transparent, black 15%);
}

.log-entry.success { color: #4ae27a; }
.log-entry.error { color: #ff6b6b; }
.log-entry.levelup { color: #f5d44a; font-weight: 600; }

.action-logs::-webkit-scrollbar {
  width: 2px;
}
</style>
