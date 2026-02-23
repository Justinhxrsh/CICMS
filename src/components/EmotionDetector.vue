<template>
  <div class="emotion-detector" :class="{ active: isCapturing }">
    <!-- Visual removed to avoid duplicate video of self -->
    <div class="video-container" v-show="false">
      <video ref="video" autoplay muted playsinline></video>
      <div class="emotion-overlay">{{ currentEmotion.toUpperCase() }}</div>
    </div>
    <div class="emotion-status" v-if="isCapturing">
       🧠 Mood: <span class="mood-text">{{ currentEmotion || 'neutral' }}</span>
    </div>
    <button @click="toggleCapture" class="toggle-btn" :title="isCapturing ? 'Stop Emotion Sync' : 'Start Emotion Sync'">
      {{ isCapturing ? '🧠' : '👁️' }}
    </button>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import emotionService from '../services/emotion';

export default {
  name: 'EmotionDetector',
  data() {
    return {
      isCapturing: false,
    };
  },
  computed: {
    ...mapState('player', { currentEmotion: 'emotion' }),
  },
  methods: {
    async toggleCapture() {
      if (this.isCapturing) {
        emotionService.stop();
        this.isCapturing = false;
      } else {
        await emotionService.startDetection();
        this.isCapturing = true;
        // Connect the service's internal video to our ref if needed
        if (emotionService.video) {
          this.$refs.video.srcObject = emotionService.video.srcObject;
        }
      }
    },
  },
  beforeDestroy() {
    emotionService.stop();
  }
};
</script>

<style scoped>
.emotion-detector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
}

.emotion-status {
  font-size: 12px;
  color: #f5d44a;
  font-weight: 600;
  text-transform: capitalize;
}

.video-container {
  display: none;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.emotion-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: #f5d44a;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  padding: 2px 0;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 200, 50, 0.4);
  background: rgba(10, 10, 25, 0.8);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(5px);
}

.toggle-btn:hover {
  background: rgba(245, 212, 74, 0.2);
  transform: scale(1.1);
}

.emotion-detector.active .toggle-btn {
  border-color: #f5d44a;
  box-shadow: 0 0 10px rgba(245, 212, 74, 0.4);
}
</style>
