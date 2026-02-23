<template>
  <canvas
    ref="canvas"
    id="game-canvas"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick"
    @mousemove="handleMouseMove"
  ></canvas>
</template>

<script>
import wsService from '../services/websocket';

const TILE_SIZE = 32;
const TILE_COLORS = {
  0: '#4a7c3f',   // grass
  1: '#2b5eab',   // water
  2: '#6e6e6e',   // mountain
  3: '#2d5a1b',   // tree
  4: '#8b7355',   // path
  5: '#a08060',   // wall
  6: '#444444',   // mine
  7: '#c8a228',   // bank
  8: '#8a5a2a',   // shop
  9: '#c8b87a',   // sand
  10: '#5a8f3a',  // flower
};


export default {
  name: 'GameCanvas',
  data() {
    return {
      canvas: null,
      ctx: null,
      animFrame: null,
      cameraX: 0,
      cameraY: 0,
      mouseCol: -1,
      mouseRow: -1,
      animTick: 0,
      lastFrame: 0,
      // Pre-compute map for rendering
      worldMap: null,
      hoverEntity: null,
    };
  },
  computed: {
    player() {
      return this.$store.state.player;
    },
    otherPlayers() {
      return this.$store.state.world.otherPlayers;
    },
    npcs() {
      return this.$store.state.world.npcs;
    },
    worldItems() {
      return this.$store.state.world.worldItems;
    },
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', this.resize);

    // Import map from constants
    import(/* webpackChunkName: "constants" */ '../../server/shared/constants.js')
      .catch(() => {
        // Fallback: generate a simple map
        this.worldMap = this.generateFallbackMap();
      })
      .then((mod) => {
        if (mod) this.worldMap = mod.WORLD_MAP;
        this.startLoop();
      });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resize);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  },
  methods: {
    resize() {
      const container = this.$el.parentElement;
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    },

    generateFallbackMap() {
      // 40x32 grass map with paths and water
      const cols = 40, rows = 32;
      const map = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) row.push(2);
          else if (r === 6 || r === 12 || r === 20) row.push(4);
          else if (c === 19) row.push(4);
          else if (c < 4 && r > 12 && r < 22) row.push(1);
          else row.push(0);
        }
        map.push(row);
      }
      return map;
    },

    startLoop() {
      const loop = (timestamp) => {
        const delta = timestamp - this.lastFrame;
        this.lastFrame = timestamp;
        this.animTick = timestamp;
        this.update(delta);
        this.render();
        this.animFrame = requestAnimationFrame(loop);
      };
      this.animFrame = requestAnimationFrame(loop);
    },

    update() {
      // Update camera to follow player
      if (!this.player || !this.canvas) return;

      const targetCamX = this.player.x - this.canvas.width / 2;
      const targetCamY = this.player.y - this.canvas.height / 2;

      // Smooth camera
      const lerp = 0.12;
      this.cameraX += (targetCamX - this.cameraX) * lerp;
      this.cameraY += (targetCamY - this.cameraY) * lerp;

      // Clamp camera
      if (this.worldMap) {
        const mapW = this.worldMap[0].length * TILE_SIZE;
        const mapH = this.worldMap.length * TILE_SIZE;
        this.cameraX = Math.max(0, Math.min(this.cameraX, mapW - this.canvas.width));
        this.cameraY = Math.max(0, Math.min(this.cameraY, mapH - this.canvas.height));
      }
    },

    render() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(-Math.floor(this.cameraX), -Math.floor(this.cameraY));

      this.renderMap(ctx);
      this.renderWorldItems(ctx);
      this.renderNPCs(ctx);
      this.renderOtherPlayers(ctx);
      this.renderPlayer(ctx);
      this.renderHoverHighlight(ctx);

      ctx.restore();
    },

    renderMap(ctx) {
      if (!this.worldMap) return;

      const startCol = Math.max(0, Math.floor(this.cameraX / TILE_SIZE) - 1);
      const startRow = Math.max(0, Math.floor(this.cameraY / TILE_SIZE) - 1);
      const endCol = Math.min(this.worldMap[0].length, startCol + Math.ceil(this.canvas.width / TILE_SIZE) + 2);
      const endRow = Math.min(this.worldMap.length, startRow + Math.ceil(this.canvas.height / TILE_SIZE) + 2);

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          const tile = this.worldMap[row][col];
          const px = col * TILE_SIZE;
          const py = row * TILE_SIZE;

          // Base tile color
          ctx.fillStyle = TILE_COLORS[tile] || '#444';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Tile details/decorations
          this.renderTileDetail(ctx, tile, px, py, col, row);
        }
      }
    },

    renderTileDetail(ctx, tile, px, py, col, row) {
      const t = this.animTick;

      switch(tile) {
        case 0: // Grass - subtle variation
          if ((col + row) % 3 === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
          break;

        case 1: // Water - animated
          ctx.fillStyle = `rgba(100,160,255,${0.2 + Math.sin(t / 800 + col * 0.5 + row * 0.3) * 0.1})`;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Ripple
          ctx.strokeStyle = `rgba(200,230,255,${0.2 + Math.sin(t / 1000 + col + row) * 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 16 + Math.sin(t / 500 + col) * 2);
          ctx.lineTo(px + 28, py + 16 + Math.sin(t / 500 + col + 1) * 2);
          ctx.stroke();
          break;

        case 2: // Mountain - rocky texture
          ctx.fillStyle = '#555555';
          ctx.fillRect(px + 6, py + 8, 20, 16);
          ctx.fillStyle = '#888888';
          ctx.fillRect(px + 10, py + 4, 12, 10);
          ctx.fillStyle = '#aaaaaa';
          ctx.fillRect(px + 13, py, 6, 6);
          break;

        case 3: // Tree
          // Trunk
          ctx.fillStyle = '#5a3a1a';
          ctx.fillRect(px + 13, py + 20, 6, 10);
          // Canopy
          ctx.fillStyle = '#1a5c1a';
          ctx.beginPath();
          ctx.arc(px + 16, py + 14, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2a7a2a';
          ctx.beginPath();
          ctx.arc(px + 14, py + 12, 8, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 4: // Path - cobblestone
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              ctx.strokeRect(px + 2 + i * 10, py + 2 + j * 10, 8, 8);
            }
          }
          break;

        case 5: // Wall - brick
          ctx.fillStyle = '#8a6a48';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(px, py + i * 10 + 1, TILE_SIZE, 2);
          }
          break;

        case 6: // Mine - dark entrance
          ctx.fillStyle = '#222222';
          ctx.fillRect(px + 6, py + 10, 20, 18);
          // Mine entrance arch
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.arc(px + 16, py + 18, 10, Math.PI, 0);
          ctx.fill();
          // Pickaxe icon
          ctx.fillStyle = '#888';
          ctx.font = '14px serif';
          ctx.fillText('⛏', px + 9, py + 22);
          break;

        case 7: // Bank - golden building
          ctx.fillStyle = '#c8a228';
          ctx.fillRect(px + 2, py + 6, 28, 22);
          ctx.fillStyle = '#f5d44a';
          ctx.fillRect(px + 6, py + 2, 20, 6);
          // Columns
          ctx.fillStyle = '#a88822';
          ctx.fillRect(px + 6, py + 8, 3, 18);
          ctx.fillRect(px + 23, py + 8, 3, 18);
          // Door
          ctx.fillStyle = '#5a3a1a';
          ctx.fillRect(px + 12, py + 18, 8, 10);
          break;

        case 8: // Shop - wooden building
          ctx.fillStyle = '#8a5a30';
          ctx.fillRect(px + 2, py + 8, 28, 20);
          // Roof
          ctx.fillStyle = '#c8701a';
          ctx.beginPath();
          ctx.moveTo(px, py + 10);
          ctx.lineTo(px + 16, py);
          ctx.lineTo(px + 32, py + 10);
          ctx.fill();
          // Window
          ctx.fillStyle = '#88ccdd';
          ctx.fillRect(px + 6, py + 12, 8, 8);
          // Door
          ctx.fillStyle = '#3a2010';
          ctx.fillRect(px + 18, py + 18, 8, 10);
          break;

        case 10: // Flower
          ctx.fillStyle = '#ff8800';
          ctx.beginPath();
          ctx.arc(px + 16, py + 16, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffdd00';
          ctx.beginPath();
          ctx.arc(px + 16, py + 16, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      // Tile grid (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
    },

    renderWorldItems(ctx) {
      const t = this.animTick;
      this.worldItems.forEach(item => {
        const px = item.col * TILE_SIZE;
        const py = item.row * TILE_SIZE;
        const bobY = Math.sin(t / 600 + item.col * 0.7) * 2;

        // Glow
        ctx.shadowColor = item.color || '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = item.color || '#ffcc00';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + bobY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Emoji
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.emoji || '📦', px + 16, py + 20 + bobY);
      });
      ctx.textAlign = 'left';
    },

    renderNPCs(ctx) {
      const t = this.animTick;
      this.npcs.forEach(npc => {
        const bobY = npc.moving ? Math.sin(t / 200) * 2 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y + 14, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // NPC body
        ctx.fillStyle = npc.color || '#4488cc';
        ctx.beginPath();
        ctx.arc(npc.x, npc.y - 2 + bobY, 14, 0, Math.PI * 2);
        ctx.fill();

        // NPC emoji
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.emoji || '👤', npc.x, npc.y + 7 + bobY);

        // Name tag
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        const nameWidth = ctx.measureText(npc.name).width + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(npc.x - nameWidth / 2, npc.y - 28 + bobY, nameWidth, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(npc.name, npc.x, npc.y - 17 + bobY);

        // Type indicator
        let typeIcon = '';
        if (npc.type === 'shop') typeIcon = '🛒';
        else if (npc.type === 'bank') typeIcon = '🏦';
        if (typeIcon) {
          ctx.font = '10px serif';
          ctx.fillText(typeIcon, npc.x + 14, npc.y - 14 + bobY);
        }
      });
      ctx.textAlign = 'left';
    },

    renderOtherPlayers(ctx) {
      const t = this.animTick;
      this.otherPlayers.forEach(p => {
        this.renderCharacter(ctx, p, false, t);
      });
    },

    renderPlayer(ctx) {
      const p = this.player;
      if (!p || !p.x) return;
      this.renderCharacter(ctx, p, true, this.animTick);
    },

    renderCharacter(ctx, p, isMe, t) {
      const px = p.x;
      const py = p.y;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(px, py + 14, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (legs animation)
      if (p.moving) {
        // Left leg
        ctx.fillStyle = '#333';
        ctx.fillRect(px - 6, py + 4, 5, 10 + Math.sin(t / 150) * 4);
        // Right leg
        ctx.fillRect(px + 1, py + 4, 5, 10 - Math.sin(t / 150) * 4);
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(px - 6, py + 4, 11, 10);
      }

      // Torso
      ctx.fillStyle = isMe ? '#2266cc' : '#cc6622';
      ctx.fillRect(px - 9, py - 8, 18, 14);

      // Head
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath();
      ctx.arc(px, py - 14, 10, 0, Math.PI * 2);
      ctx.fill();

      // Eyes based on direction
      ctx.fillStyle = '#333';
      if (p.direction === 'south' || !p.direction) {
        ctx.beginPath();
        ctx.arc(px - 3, py - 15, 2, 0, Math.PI * 2);
        ctx.arc(px + 3, py - 15, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.direction === 'north') {
        // Back of head, no eyes
      } else if (p.direction === 'east') {
        ctx.beginPath();
        ctx.arc(px + 4, py - 14, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.direction === 'west') {
        ctx.beginPath();
        ctx.arc(px - 4, py - 14, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player glow if "me"
      if (isMe) {
        const emotionColors = {
          happy: 'rgba(255, 220, 0, 0.8)',
          sad: 'rgba(0, 100, 255, 0.8)',
          angry: 'rgba(255, 0, 0, 0.8)',
          fear: 'rgba(150, 0, 255, 0.8)',
          neutral: 'rgba(100, 180, 255, 0.8)',
        };
        const glowColor = emotionColors[p.emotion] || emotionColors.neutral;
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py - 14, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Name tag
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const nameW = ctx.measureText(p.name).width + 10;

      ctx.fillStyle = isMe ? 'rgba(20,60,120,0.8)' : 'rgba(0,0,0,0.7)';
      ctx.fillRect(px - nameW / 2, py - 34, nameW, 16);

      ctx.fillStyle = isMe ? '#88ccff' : '#ffffff';
      ctx.fillText(p.name, px, py - 22);

      // Health bar
      if (p.health !== undefined && p.maxHealth > 0) {
        const barW = 32;
        const barH = 3;
        const barX = px - barW / 2;
        const barY = py - 38;
        const pct = p.health / p.maxHealth;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = pct > 0.5 ? '#44dd44' : pct > 0.25 ? '#dddd44' : '#dd4444';
        ctx.fillRect(barX, barY, barW * pct, barH);
      }

      ctx.textAlign = 'left';
    },

    renderHoverHighlight(ctx) {
      if (this.mouseCol < 0 || this.mouseRow < 0) return;
      const px = this.mouseCol * TILE_SIZE;
      const py = this.mouseRow * TILE_SIZE;
      ctx.strokeStyle = 'rgba(255,255,100,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    },

    // Convert screen coords to world tile
    screenToTile(screenX, screenY) {
      const worldX = screenX + this.cameraX;
      const worldY = screenY + this.cameraY;
      return {
        col: Math.floor(worldX / TILE_SIZE),
        row: Math.floor(worldY / TILE_SIZE),
      };
    },

    handleClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { col, row } = this.screenToTile(screenX, screenY);

      // Check if clicking on an NPC
      const clickedNPC = this.getNearbyEntity(col, row, 'npc');
      if (clickedNPC) {
        wsService.interact(clickedNPC.id, 'npc');
        return;
      }

      // Check if clicking on a world item
      const clickedItem = this.getNearbyEntity(col, row, 'item');
      if (clickedItem) {
        wsService.interact(clickedItem.id, 'item');
        return;
      }

      // Otherwise move to that tile
      wsService.moveRequest(col, row);
    },

    handleRightClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { col, row } = this.screenToTile(screenX, screenY);

      // Collect context options
      const options = [];

      // Check NPC
      const npc = this.getNearbyEntity(col, row, 'npc');
      if (npc) {
        if (npc.type === 'shop') options.push({ label: `🛒 Trade with ${npc.name}`, action: () => wsService.interact(npc.id, 'npc') });
        else if (npc.type === 'bank') options.push({ label: `🏦 Bank with ${npc.name}`, action: () => wsService.interact(npc.id, 'npc') });
        else options.push({ label: `💬 Talk to ${npc.name}`, action: () => wsService.interact(npc.id, 'npc') });
      }

      // Check world item
      const item = this.getNearbyEntity(col, row, 'item');
      if (item) {
        options.push({ label: `✋ Pick up ${item.name}`, action: () => wsService.interact(item.id, 'item') });
      }

      // Check for resource zones
      const zoneOption = this.getZoneOption(col, row);
      if (zoneOption) options.push(zoneOption);

      // Walk here
      options.push({ label: `🚶 Walk here`, action: () => wsService.moveRequest(col, row) });

      // Show context menu
      if (options.length > 0) {
        this.$root.$emit('show-context-menu', {
          event: e,
          type: npc ? 'npc' : (item ? 'worldItem' : 'walk'),
          npc,
          worldItem: item,
          options,
          col,
          row
        });
      }
    },

    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const { col, row } = this.screenToTile(e.clientX - rect.left, e.clientY - rect.top);
      this.mouseCol = col;
      this.mouseRow = row;
    },

    getNearbyEntity(col, row, type) {
      const maxDist = 2;
      if (type === 'npc') {
        return this.npcs.find(n => Math.abs(n.col - col) <= maxDist && Math.abs(n.row - row) <= maxDist) || null;
      }
      if (type === 'item') {
        return this.worldItems.find(i => Math.abs(i.col - col) <= maxDist && Math.abs(i.row - row) <= maxDist) || null;
      }
      return null;
    },

    getZoneOption(col, row) {
      // Match to respawn zones
      const zones = {
        IRON_MINE: { col: 5, row: 5, radius: 3, label: '⛏️ Mine Iron Ore' },
        GOLD_MINE: { col: 8, row: 3, radius: 2, label: '⛏️ Mine Gold Ore' },
        FISHING_SPOT: { col: 2, row: 18, radius: 2, label: '🎣 Fish here' },
        GRAVEYARD: { col: 34, row: 26, radius: 3, label: '🦴 Gather bones' },
      };

      for (const [key, zone] of Object.entries(zones)) {
        if (Math.abs(col - zone.col) <= zone.radius && Math.abs(row - zone.row) <= zone.radius) {
          return {
            label: zone.label,
            action: () => wsService.gather(null, key),
          };
        }
      }
      return null;
    },
  },
};
</script>

<style scoped>
#game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
