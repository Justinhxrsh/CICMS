<template>
  <div id="login-page">
    <div class="stars"></div>
    <div class="login-container">
      <div class="game-logo">
        <div class="logo-emblem">⚔️</div>
        <h1 class="game-title">DELAFORD</h1>
        <p class="game-subtitle">A Multiplayer Medieval RPG</p>
      </div>

      <div class="login-card">
        <h2>Enter The Realm</h2>

        <div v-if="errorMsg" class="error-banner">
          ⚠️ {{ errorMsg }}
        </div>

        <div class="input-group">
          <label for="player-name">Character Name</label>
          <input
            id="player-name"
            v-model="playerName"
            type="text"
            placeholder="Enter your name..."
            maxlength="20"
            minlength="2"
            @keyup.enter="joinGame"
            :disabled="loading"
            autocomplete="off"
            spellcheck="false"
          />
          <span class="char-count">{{ playerName.length }}/20</span>
        </div>

        <div class="avatar-preview">
          <div class="avatar-circle" :style="{ backgroundColor: selectedColor }">
            {{ playerName.charAt(0).toUpperCase() || '?' }}
          </div>
          <div class="color-options">
            <div
              v-for="color in avatarColors"
              :key="color"
              class="color-dot"
              :class="{ active: selectedColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectedColor = color"
            ></div>
          </div>
        </div>

        <button
          id="join-btn"
          class="join-btn"
          :disabled="!canJoin || loading"
          @click="joinGame"
        >
          <span v-if="loading" class="loading-spinner">⏳</span>
          <span v-else>⚔️ Enter Delaford</span>
        </button>

        <div class="server-status">
          <span class="status-dot" :class="{ online: serverOnline, offline: !serverOnline }"></span>
          {{ serverOnline ? 'Server Online' : 'Checking server...' }}
        </div>
      </div>

      <div class="feature-list">
        <div class="feature">🗡️ Real-time Multiplayer</div>
        <div class="feature">🏪 Trading &amp; Shops</div>
        <div class="feature">⛏️ Mining &amp; Gathering</div>
        <div class="feature">🏦 Banking System</div>
        <div class="feature">🗺️ Explorable World</div>
      </div>
    </div>
  </div>
</template>

<script>
import wsService from '../services/websocket';

export default {
  name: 'Login',
  data() {
    return {
      playerName: '',
      loading: false,
      errorMsg: '',
      serverOnline: false,
      selectedColor: '#4a90e2',
      avatarColors: [
        '#4a90e2', '#e24a4a', '#4ae27a', '#e2c44a',
        '#c44ae2', '#4ae2d9', '#e27a4a', '#aaaaaa',
      ],
    };
  },
  computed: {
    canJoin() {
      return this.playerName.trim().length >= 2 && this.playerName.trim().length <= 20;
    },
  },
  mounted() {
    this.checkServer();
    // Restore last name
    const saved = localStorage.getItem('delaford_player');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) this.playerName = data.name;
      } catch (e) {
        // ignore
      }
    }
  },
  methods: {
    async checkServer() {
      try {
        const ws = new WebSocket(`ws://${window.location.hostname}:6500`);
        ws.onopen = () => {
          this.serverOnline = true;
          ws.close();
        };
        ws.onerror = () => {
          this.serverOnline = false;
        };
      } catch (e) {
        this.serverOnline = false;
      }
    },
    async joinGame() {
      if (!this.canJoin || this.loading) return;
      this.errorMsg = '';
      this.loading = true;

      const name = this.playerName.trim();

      try {
        await wsService.connect(name);
        localStorage.setItem('delaford_player', JSON.stringify({ name }));
        this.$router.push('/game');
      } catch (err) {
        this.errorMsg = err.message || 'Failed to connect. Make sure the server is running.';
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cinzel:wght@400;600;900&family=Inter:wght@400;500;600&display=swap');

#login-page {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a1a 60%, #000010 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  font-family: 'Inter', sans-serif;
}

.stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 10%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 10% 80%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 70%, rgba(255,255,255,0.8) 0%, transparent 100%),
    radial-gradient(2px 2px at 40% 20%, rgba(255,255,200,0.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 85%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.6) 0%, transparent 100%);
  animation: twinkle 5s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  z-index: 10;
  padding: 20px;
}

.game-logo {
  text-align: center;
}

.logo-emblem {
  font-size: 56px;
  filter: drop-shadow(0 0 20px rgba(255, 200, 50, 0.8));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.game-title {
  font-family: 'Cinzel', serif;
  font-size: 52px;
  font-weight: 900;
  background: linear-gradient(135deg, #f5d44a 0%, #e8a020 40%, #f5d44a 80%, #c8831a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 8px;
  margin: 8px 0 4px;
  text-shadow: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.game-subtitle {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

.login-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,200,50,0.2);
  border-radius: 16px;
  padding: 32px;
  width: 380px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 20px 60px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.08);
}

.login-card h2 {
  font-family: 'Cinzel', serif;
  color: #f5d44a;
  font-size: 20px;
  text-align: center;
  margin: 0 0 24px;
  letter-spacing: 2px;
}

.error-banner {
  background: rgba(220, 50, 50, 0.15);
  border: 1px solid rgba(220,50,50,0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #ff8080;
  font-size: 13px;
  margin-bottom: 16px;
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,200,50,0.2);
  border-radius: 8px;
  padding: 12px 14px;
  color: #fff;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.input-group input:focus {
  border-color: rgba(245,212,74,0.6);
  box-shadow: 0 0 0 3px rgba(245,212,74,0.1);
}

.input-group input::placeholder {
  color: rgba(255,255,255,0.2);
}

.char-count {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 11px;
  color: rgba(255,255,255,0.3);
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  border: 2px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s, border-color 0.15s;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  border-color: white;
  transform: scale(1.2);
}

.join-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #c8831a 0%, #f5d44a 50%, #c8831a 100%);
  border: none;
  border-radius: 10px;
  color: #1a0a00;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(200,131,26,0.4);
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(200,131,26,0.6);
}

.join-btn:active:not(:disabled) {
  transform: translateY(0);
}

.join-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-dot.online {
  background: #4ae27a;
  box-shadow: 0 0 6px rgba(74,226,122,0.6);
}

.status-dot.offline {
  background: #e24a4a;
}

.feature-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.feature {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
</style>
