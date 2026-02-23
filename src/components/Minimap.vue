<template>
  <div class="minimap">
    <canvas ref="canvas" width="200" height="200"></canvas>
    <div class="coords" v-if="player">
      X: {{ player.col }}, Y: {{ player.row }}
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { WORLD_MAP } from '../../server/shared/constants';

export default {
  name: 'Minimap',
  computed: {
    ...mapState('player', { player: state => state }),
    ...mapState('world', ['otherPlayers', 'npcs']),
  },
  watch: {
    'player.col': 'draw',
    'player.row': 'draw',
    otherPlayers: { handler: 'draw', deep: true },
    npcs: { handler: 'draw', deep: true },
  },
  mounted() {
    this.draw();
  },
  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const size = 4; // pixels per tile
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw map (simplified)
      for (let r = 0; r < WORLD_MAP.length; r++) {
        for (let c = 0; c < WORLD_MAP[r].length; c++) {
          const tile = WORLD_MAP[r][c];
          if (tile === 0) ctx.fillStyle = '#1a3c1a'; // Grass
          else if (tile === 1) ctx.fillStyle = '#2a4a7a'; // Water
          else if (tile === 2) ctx.fillStyle = '#4a4a4a'; // Mountain
          else ctx.fillStyle = '#3a2a1a'; // Path/Floor
          
          ctx.fillRect(c * size, r * size, size, size);
        }
      }

      // Draw NPCs (Yellow)
      ctx.fillStyle = '#f5d44a';
      this.npcs.forEach(n => {
        ctx.fillRect(n.col * size, n.row * size, size, size);
      });

      // Draw other players (Green)
      ctx.fillStyle = '#4ae27a';
      this.otherPlayers.forEach(p => {
        ctx.fillRect(p.col * size, p.row * size, size, size);
      });

      // Draw self (White)
      if (this.player) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.player.col * size, this.player.row * size, size, size);
        
        // Draw border around self to make it pop
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.player.col * size - 1, this.player.row * size - 1, size + 2, size + 2);
      }
    }
  }
};
</script>

<style scoped>
.minimap {
  background: #000;
  border: 1px solid rgba(255, 200, 50, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  image-rendering: pixelated;
}

.coords {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 1px 4px;
  border-radius: 2px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}
</style>
