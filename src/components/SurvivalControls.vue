<template>
  <div class="survival-controls">
    <div class="control-group">
      <button @click="setTime('day')" title="Set to Morning" class="control-btn">☀️</button>
      <button @click="setTime('night')" title="Set to Night" class="control-btn">🌙</button>
    </div>
    <div class="control-group">
      <button @click="isMuted = !isMuted" :title="isMuted ? 'Unmute Game' : 'Mute Game'" class="control-btn">
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
    </div>
  </div>
</template>

<script>
import wsService from '../services/websocket';

export default {
  name: 'SurvivalControls',
  data() {
    return {
      isMuted: false,
    };
  },
  methods: {
    setTime(time) {
      wsService.action('COMMAND', { command: 'time', args: [time] });
    },
  },
};
</script>

<style scoped>
.survival-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1001;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  background: rgba(10, 10, 25, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 200, 50, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.control-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 200, 50, 0.2);
  border-color: rgba(255, 200, 50, 0.5);
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}
</style>
