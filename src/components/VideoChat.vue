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
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  pointer-events: none;
}

.local-video-wrapper, .remote-video-wrapper {
  position: relative;
  width: 140px;
  height: 105px;
  background: #222;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 200, 50, 0.4);
  pointer-events: auto;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  transition: transform 0.2s;
}

.local-video-wrapper:hover, .remote-video-wrapper:hover {
  transform: scale(1.05);
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-controls {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.video-controls button {
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.video-controls button.off {
  background: rgba(200, 50, 50, 0.8);
}

.peer-name {
  position: absolute;
  bottom: 2px;
  left: 4px;
  background: rgba(0,0,0,0.6);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: #fff;
  white-space: nowrap;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
