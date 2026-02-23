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
      <input
        v-model="inputMsg"
        type="text"
        placeholder="Type to chat..."
        maxlength="100"
        @keyup.enter="sendMessage"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import wsService from '../services/websocket';

export default {
  name: 'ChatLog',
  data() {
    return {
      inputMsg: '',
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
      wsService.chat(msg);
      this.inputMsg = '';
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
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
