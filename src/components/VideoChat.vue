<template>
  <div class="video-chat-container">
    <div class="local-video-wrapper">
      <video ref="localVideo" autoplay muted playsinline></video>
      <div class="video-controls">
        <button @click="toggleAudio" :class="{ 'off': !audioEnabled }">
          {{ audioEnabled ? '🎤' : '🔇' }}
        </button>
        <button @click="toggleVideo" :class="{ 'off': !videoEnabled }">
          {{ videoEnabled ? '📷' : '🚫' }}
        </button>
      </div>
    </div>
    <div class="remote-videos">
      <div v-for="peer in remotePeers" :key="peer.id" class="remote-video-wrapper">
        <video :id="'video-' + peer.id" autoplay playsinline></video>
        <div class="peer-name">{{ peer.name || 'Player' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import wsService from '../services/websocket';

export default {
  name: 'VideoChat',
  data() {
    return {
      localStream: null,
      audioEnabled: true,
      videoEnabled: true,
      peers: {}, // { playerId: RTCPeerConnection }
      remotePeers: [], // Array of { id, stream, name }
      iceServers: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    };
  },
  computed: {
    otherPlayers() {
      return this.$store.state.world.otherPlayers;
    },
    myId() {
      return this.$store.state.player.id;
    }
  },
  async mounted() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (this.$refs.localVideo) {
        this.$refs.localVideo.srcObject = this.localStream;
      }
    } catch (err) {
      console.error('[WebRTC] Failed to get user media', err);
    }

    wsService.on('WEBRTC_SIGNAL', this.handleSignal);
    
    // Initiate connection to everyone already in the game
    this.initiatePeers(this.otherPlayers);
  },
  beforeDestroy() {
    wsService.off('WEBRTC_SIGNAL', this.handleSignal);
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
    }
    Object.values(this.peers).forEach(pc => pc.close());
  },
  methods: {
    toggleAudio() {
      this.audioEnabled = !this.audioEnabled;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(t => t.enabled = this.audioEnabled);
      }
    },
    toggleVideo() {
      this.videoEnabled = !this.videoEnabled;
      if (this.localStream) {
        this.localStream.getVideoTracks().forEach(t => t.enabled = this.videoEnabled);
      }
    },
    initiatePeers(players) {
      players.forEach(async p => {
        if (!this.peers[p.id]) {
          const pc = this.createPeerConnection(p.id);
          this.peers[p.id] = pc;
          
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            wsService.send({
              type: 'WEBRTC_SIGNAL',
              targetId: p.id,
              signal: { type: 'offer', sdp: offer.sdp }
            });
          } catch (e) {
            console.error('[WebRTC] Error creating offer', e);
          }
        }
      });
    },
    createPeerConnection(targetId) {
      const pc = new RTCPeerConnection(this.iceServers);
      
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.localStream);
        });
      }

      pc.onicecandidate = event => {
        if (event.candidate) {
          wsService.send({
            type: 'WEBRTC_SIGNAL',
            targetId,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      pc.ontrack = event => {
        console.log('[WebRTC] Track received from', targetId);
        const player = this.otherPlayers.find(p => p.id === targetId);
        const name = player ? player.name : 'Unknown';
        
        const existing = this.remotePeers.find(p => p.id === targetId);
        if (existing) {
          existing.stream = event.streams[0];
        } else {
          this.remotePeers.push({ id: targetId, stream: event.streams[0], name });
        }
        
        this.$nextTick(() => {
          const videoEl = document.getElementById('video-' + targetId);
          if (videoEl && videoEl.srcObject !== event.streams[0]) {
            videoEl.srcObject = event.streams[0];
          }
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          this.removePeer(targetId);
        }
      };

      return pc;
    },
    async handleSignal(data) {
      const { sourceId, signal } = data;
      let pc = this.peers[sourceId];
      
      if (!pc) {
        pc = this.createPeerConnection(sourceId);
        this.peers[sourceId] = pc;
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          wsService.send({
            type: 'WEBRTC_SIGNAL',
            targetId: sourceId,
            signal: { type: 'answer', sdp: answer.sdp }
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error handling signal', err);
      }
    },
    removePeer(id) {
      if (this.peers[id]) {
        this.peers[id].close();
        delete this.peers[id];
      }
      this.remotePeers = this.remotePeers.filter(p => p.id !== id);
    }
  }
};
</script>

<style scoped>
.video-chat-container {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 1000;
  pointer-events: none;
}

.local-video-wrapper, .remote-video-wrapper {
  position: relative;
  width: 220px;
  height: 140px;
  background: rgba(10, 10, 20, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.local-video-wrapper:hover, .remote-video-wrapper:hover {
  transform: scale(1.03) translateY(-2px);
  border-color: rgba(255, 200, 50, 0.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 200, 50, 0.1);
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.video-controls {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.local-video-wrapper:hover .video-controls {
  opacity: 1;
}

.video-controls button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.video-controls button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.video-controls button.off {
  background: rgba(235, 87, 87, 0.8);
  border-color: rgba(235, 87, 87, 1);
}

.peer-name {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
