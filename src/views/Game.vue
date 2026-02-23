<template>
  <div id="game-page">
    <div class="game-layout">
      <!-- Left sidebar: Character info + Inventory -->
      <div class="sidebar sidebar-left">
        <div class="player-panel">
          <div class="player-avatar" :style="{ backgroundColor: '#4a90e2' }">
            {{ playerName.charAt(0).toUpperCase() }}
          </div>
          <div class="player-info">
            <div class="player-name">{{ playerName }}</div>
            <div class="player-level">Level {{ playerLevel }}</div>
          </div>
          <div class="connection-badge" :class="{ connected: isConnected }">
            {{ isConnected ? '🟢' : '🔴' }}
          </div>
        </div>

        <HUD />

        <div class="sidebar-tabs">
          <button
            v-for="tab in sidebarTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
            :title="tab.label"
          >
            {{ tab.icon }}
          </button>
        </div>

        <div class="tab-content">
          <Inventory v-if="activeTab === 'inventory'" />
          <CharacterWear v-if="activeTab === 'equipment'" />
          <Skills v-if="activeTab === 'skills'" />
        </div>

        <!-- Video & Emotion tabs moved here (below inventory) -->
        <div class="sidebar-video-area">
          <EmotionDetector />
          <VideoChat />
        </div>
      </div>

      <!-- Main game canvas -->
      <div class="game-canvas-container">
        <GameCanvas ref="gameCanvas" />
        <SurvivalControls />
        <ContextMenu ref="contextMenu" />
        <div v-if="levelUpMessage" class="level-up-toast">
          🎉 {{ levelUpMessage }}
        </div>
      </div>

      <!-- Right sidebar: Chat + Action log -->
      <div class="sidebar sidebar-right">
        <div class="gold-display">
          <span class="gold-icon">🪙</span>
          <span class="gold-amount">{{ gold.toLocaleString() }}g</span>
        </div>

        <div class="minimap-container">
          <minimap ref="minimap" />
        </div>

        <ChatLog />

        <div class="player-list">
          <h4>Players Online ({{ playerCount }})</h4>
          <div v-for="p in otherPlayers" :key="p.id" class="player-entry">
            <span class="player-dot">●</span> {{ p.name }}
          </div>
          <div class="player-entry self">
            <span class="player-dot self-dot">●</span> {{ playerName }} (You)
          </div>
        </div>
      </div>
    </div>

    <!-- NPC Interaction Modals -->
    <ShopModal v-if="interactingWith && (interactingWith.type === 'shop')" />
    <BankModal v-if="interactingWith && interactingWith.type === 'bank'" />
    <DialogModal v-if="interactingWith && interactingWith.type === 'dialog'" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import wsService from '../services/websocket';
import GameCanvas from '../components/GameCanvas.vue';
import Inventory from '../components/Inventory.vue';
import CharacterWear from '../components/CharacterWear.vue';
import ChatLog from '../components/ChatLog.vue';
import ContextMenu from '../components/ContextMenu.vue';
import HUD from '../components/HUD.vue';
import ShopModal from '../components/ShopModal.vue';
import BankModal from '../components/BankModal.vue';
import DialogModal from '../components/DialogModal.vue';
import Skills from '../components/Skills.vue';
import Minimap from '../components/Minimap.vue';
import EmotionDetector from '../components/EmotionDetector.vue';
import VideoChat from '../components/VideoChat.vue';
import SurvivalControls from '../components/SurvivalControls.vue';

export default {
  name: 'Game',
  components: {
    GameCanvas,
    Inventory,
    CharacterWear,
    ChatLog,
    ContextMenu,
    HUD,
    ShopModal,
    BankModal,
    DialogModal,
    Skills,
    Minimap,
    EmotionDetector,
    VideoChat,
    SurvivalControls,
  },
  data() {
    return {
      activeTab: 'inventory',
      levelUpMessage: null,
      levelUpTimer: null,
      sidebarTabs: [
        { id: 'inventory', icon: '🎒', label: 'Inventory' },
        { id: 'equipment', icon: '🛡️', label: 'Equipment' },
        { id: 'skills', icon: '⚙️', label: 'Skills' },
      ],
    };
  },
  computed: {
    ...mapState('player', ['name', 'gold', 'connected']),
    ...mapGetters('player', ['playerLevel']),
    ...mapState('world', ['otherPlayers', 'interactingWith']),
    playerName() {
      return this.$store.state.player.name;
    },
    isConnected() {
      return this.$store.state.player.connected;
    },
    playerCount() {
      return this.otherPlayers.length + 1;
    },
  },
  mounted() {
    wsService.on('LEVEL_UP', this.showLevelUp);
  },
  beforeDestroy() {
    wsService.off('LEVEL_UP', this.showLevelUp);
  },
  methods: {
    showLevelUp(data) {
      this.levelUpMessage = data.message;
      if (this.levelUpTimer) clearTimeout(this.levelUpTimer);
      this.levelUpTimer = setTimeout(() => {
        this.levelUpMessage = null;
      }, 4000);
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@400;500;600&display=swap');

#game-page {
  height: 100vh;
  background: #0a0a14;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.game-layout {
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: rgba(10,10,25,0.95);
  border-color: rgba(255,200,50,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.sidebar-left {
  border-right: 1px solid rgba(255,200,50,0.15);
}

.sidebar-right {
  border-left: 1px solid rgba(255,200,50,0.15);
}

.player-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid rgba(255,200,50,0.1);
  background: rgba(0,0,0,0.3);
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 13px;
  font-weight: 600;
  color: #f5d44a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-level {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}

.connection-badge {
  font-size: 10px;
}

.gold-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,200,50,0.1);
  background: rgba(0,0,0,0.3);
}

.gold-icon { font-size: 16px; }

.gold-amount {
  font-size: 14px;
  font-weight: 600;
  color: #f5d44a;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255,200,50,0.1);
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
  color: rgba(255,255,255,0.5);
}

.tab-btn:hover {
  background: rgba(255,200,50,0.08);
}

.tab-btn.active {
  background: rgba(255,200,50,0.12);
  border-bottom: 2px solid #f5d44a;
  color: #f5d44a;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.tab-content::-webkit-scrollbar {
  width: 4px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background: rgba(255,200,50,0.3);
  border-radius: 2px;
}

.game-canvas-container {
  position: relative;
  overflow: hidden;
  background: #000;
}

.video-overlay {
  display: none; /* Removed from absolute overlay */
}

.sidebar-video-area {
  padding: 10px;
  border-top: 1px solid rgba(255,200,50,0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0,0,0,0.2);
}

.minimap-container {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,200,50,0.1);
}

.player-list {
  padding: 10px 12px;
  border-top: 1px solid rgba(255,200,50,0.1);
}

.player-list h4 {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px;
}

.player-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  padding: 2px 0;
}

.player-dot {
  color: #4ae27a;
  font-size: 8px;
}

.player-entry.self {
  color: #f5d44a;
}

.self-dot {
  color: #f5d44a !important;
}

.level-up-toast {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(30,15,0,0.95), rgba(60,30,0,0.95));
  border: 2px solid #f5d44a;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  color: #f5d44a;
  font-weight: 600;
  z-index: 1000;
  animation: levelUpPop 0.4s ease-out;
  box-shadow: 0 0 30px rgba(245,212,74,0.4);
  pointer-events: none;
}

@keyframes levelUpPop {
  0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
  70% { transform: translateX(-50%) scale(1.05); }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}
</style>
