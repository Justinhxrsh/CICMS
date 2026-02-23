<template>
  <div class="chat-log">
    <div class="chat-messages" ref="messageBox">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="chat-entry"
      >
        <span class="chat-time">[{{ formatTime(msg.timestamp) }}]</span>
        <span class="chat-name" :class="{ self: msg.playerId === myId }">{{ msg.playerName }}:</span>
        <span class="chat-text">{{ msg.message }}</span>
      </div>
    </div>
    <div class="chat-input-container">
      <div v-if="suggestions.length > 0" class="suggestions-box">
        <div 
          v-for="(sug, index) in suggestions" 
          :key="index"
          class="suggestion-item"
          :class="{ selected: index === selectedSuggestion }"
          @click="selectSuggestion(index)"
        >
          <span class="sug-text">{{ sug.text }}</span>
          <span class="sug-desc">{{ sug.description }}</span>
        </div>
      </div>
      <input
        v-model="inputMsg"
        type="text"
        placeholder="Type to chat or / commands..."
        maxlength="100"
        @keyup.enter="sendMessage"
        @keydown.tab.prevent="onTab"
        @keydown.up.prevent="onArrowUp"
        @keydown.down.prevent="onArrowDown"
        @input="onInput"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import wsService from '../services/websocket';
import { CommandPrompt } from '../utils/CommandPrompt';

const commandPrompt = new CommandPrompt();

export default {
  name: 'ChatLog',
  data() {
    return {
      inputMsg: '',
      suggestions: [],
      selectedSuggestion: 0,
    };
  },
  computed: {
    ...mapState('chat', ['messages']),
    ...mapState('player', { myId: 'id' }),
  },
  watch: {
    messages() {
      this.$nextTick(this.scrollToBottom);
    },
  },
  mounted() {
    this.scrollToBottom();
  },
  methods: {
    formatTime(ts) {
      if (!ts) return '';
      const date = new Date(ts);
      return date.getHours().toString().padStart(2, '0') + ':' +
             date.getMinutes().toString().padStart(2, '0');
    },
    sendMessage() {
      const msg = this.inputMsg.trim();
      if (!msg) return;
      
      if (msg.startsWith('/')) {
        const parts = msg.substring(1).split(' ');
        if (parts.length > 0 && parts[0]) {
            wsService.action('COMMAND', { command: parts[0].toLowerCase(), args: parts.slice(1) });
        }
      } else {
        wsService.chat(msg);
      }
      
      this.inputMsg = '';
      this.suggestions = [];
    },
    onInput() {
      if (this.inputMsg.startsWith('/')) {
         const itemIds = ['wood', 'ruby', 'diamond', 'iron_sword', 'pickaxe']; // Minimal list
         this.suggestions = commandPrompt.getSuggestions(this.inputMsg, itemIds);
         this.selectedSuggestion = 0;
      } else {
         this.suggestions = [];
      }
    },
    onTab() {
      if (this.suggestions.length > 0) {
        this.inputMsg = this.suggestions[this.selectedSuggestion].text + ' ';
        this.onInput();
      }
    },
    onArrowUp() {
      if (this.suggestions.length > 0) {
        this.selectedSuggestion = Math.max(0, this.selectedSuggestion - 1);
      }
    },
    onArrowDown() {
      if (this.suggestions.length > 0) {
        this.selectedSuggestion = Math.min(this.suggestions.length - 1, this.selectedSuggestion + 1);
      }
    },
    selectSuggestion(index) {
        this.inputMsg = this.suggestions[index].text + ' ';
        this.onInput();
        this.$el.querySelector('input').focus();
    },
    scrollToBottom() {
      const box = this.$refs.messageBox;
      if (box) box.scrollTop = box.scrollHeight;
    },
  },
};
</script>

<style scoped>
.chat-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
  height: 300px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-entry {
  font-size: 12px;
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-time {
  color: rgba(255, 255, 255, 0.3);
  margin-right: 6px;
}

.chat-name {
  font-weight: 700;
  color: #4a90e2;
  margin-right: 6px;
}

.chat-name.self {
  color: #f5d44a;
}

.chat-text {
  color: rgba(255, 255, 255, 0.9);
}

.chat-input-container {
  position: relative;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.suggestions-box {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 200, 50, 0.3);
  border-radius: 4px 4px 0 0;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.suggestion-item {
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.suggestion-item:hover, .suggestion-item.selected {
  background: rgba(255, 200, 50, 0.2);
  color: #f5d44a;
}

.sug-text {
  font-weight: 600;
}

.sug-desc {
  opacity: 0.6;
  font-size: 11px;
}

.chat-input-container input {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 200, 50, 0.2);
  border-radius: 4px;
  padding: 6px 10px;
  color: white;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.chat-input-container input:focus {
  border-color: rgba(255, 200, 50, 0.5);
}
</style>
