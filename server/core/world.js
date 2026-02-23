import { generateId, tileDistance, isTileWalkable } from '../shared/utils.js';
import { NPC } from './npc.js';
import { WORLD_MAP, GAME, RESPAWN_ZONES, ITEM_DEFS } from '../shared/constants.js';
import { SurvivalSystem } from './survival.js';

// World items (dropped/spawned on the map)
class WorldItem {
    constructor(defKey, col, row) {
        this.id = generateId();
        this.defKey = defKey;
        const def = ITEM_DEFS[defKey];
        this.name = def.name;
        this.emoji = def.emoji;
        this.color = def.color;
        this.col = col;
        this.row = row;
        this.value = def.value;
        this.spawnedAt = Date.now();
    }

    toPublic() {
        return {
            id: this.id,
            defKey: this.defKey,
            name: this.name,
            emoji: this.emoji,
            color: this.color,
            col: this.col,
            row: this.row,
        };
    }
}

// Respawn tracker
class RespawnTracker {
    constructor(zoneKey, zone) {
        this.zoneKey = zoneKey;
        this.zone = zone;
        this.items = []; // Active WorldItems for this zone
        this.cooldowns = new Map(); // itemId -> respawnAt timestamp
        this.maxItems = zone.radius * 2;
        this.initialized = false;
    }

    // Initial spawn
    init(world) {
        for (let i = 0; i < this.maxItems; i++) {
            this.spawnItem(world);
        }
        this.initialized = true;
    }

    spawnItem(world) {
        const itemKey = this.zone.items[Math.floor(Math.random() * this.zone.items.length)];

        // Find a valid tile near zone center
        for (let attempts = 0; attempts < 20; attempts++) {
            const col = this.zone.col + Math.floor(Math.random() * (this.zone.radius * 2 + 1)) - this.zone.radius;
            const row = this.zone.row + Math.floor(Math.random() * (this.zone.radius * 2 + 1)) - this.zone.radius;
            const tileType = WORLD_MAP[row]?.[col];
            if (isTileWalkable(col, row) || tileType === 2 || tileType === 3) { // allow on mountain/mine (2) and tree (3) tiles
                const item = new WorldItem(itemKey, col, row);
                this.items.push(item);
                world.worldItems.set(item.id, item);
                return item;
            }
        }
    }

    // Check and respawn depleted items
    tick(world, now) {
        for (const [itemId, respawnAt] of this.cooldowns) {
            if (now >= respawnAt) {
                this.cooldowns.delete(itemId);
                if (this.items.length < this.maxItems) {
                    this.spawnItem(world);
                }
            }
        }
    }

    // Item was gathered - remove and schedule respawn
    itemGathered(itemId) {
        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            this.items.splice(idx, 1);
        }
        this.cooldowns.set(itemId, Date.now() + this.zone.cooldown);
    }
}

export class World {
    constructor() {
        this.players = new Map();         // playerId -> Player
        this.npcs = new Map();            // npcId -> NPC
        this.worldItems = new Map();      // itemId -> WorldItem
        this.respawnTrackers = new Map(); // zoneKey -> RespawnTracker
        this.chatHistory = [];
        this.lastTick = Date.now();
        this.survival = new SurvivalSystem(this);

        this.initNPCs();
        this.initRespawns();
    }

    initNPCs() {
        // Place NPCs on the map based on tile positions
        const npcPlacements = [
            { defKey: 'MERCHANT', col: 23, row: 9 },
            { defKey: 'BLACKSMITH', col: 23, row: 16 },
            { defKey: 'BANKER', col: 17, row: 15 },
            { defKey: 'GUARD', col: 19, row: 7 },
            { defKey: 'FISHERMAN', col: 3, row: 17 },
        ];

        npcPlacements.forEach(({ defKey, col, row }) => {
            const npc = new NPC(defKey, col, row);
            this.npcs.set(npc.id, npc);
        });

        console.log(`[World] Initialized ${this.npcs.size} NPCs`);
    }

    initRespawns() {
        Object.entries(RESPAWN_ZONES).forEach(([key, zone]) => {
            const tracker = new RespawnTracker(key, zone);
            this.respawnTrackers.set(key, tracker);
            tracker.init(this);
        });
        console.log(`[World] Initialized ${this.respawnTrackers.size} respawn zones`);
    }

    // Server tick - update movement and respawns
    tick() {
        const now = Date.now();
        const delta = now - this.lastTick;
        this.lastTick = now;

        this.survival.tick(delta);

        // Update NPCs
        const updatedNPCs = [];
        for (const npc of this.npcs.values()) {
            const moved = npc.updateWander(delta);
            if (moved) updatedNPCs.push(npc.toPublic());
        }

        // Update players
        const updatedPlayers = [];
        for (const player of this.players.values()) {
            if (player.moving) {
                player.update(delta);
                updatedPlayers.push(player.toPublic());
            }
        }

        // Respawn items
        for (const tracker of this.respawnTrackers.values()) {
            tracker.tick(this, now);
        }

        return { updatedNPCs, updatedPlayers };
    }

    // Find which respawn zone a world item belongs to
    findRespawnZone(worldItemId) {
        for (const [key, tracker] of this.respawnTrackers) {
            if (tracker.items.find(i => i.id === worldItemId)) {
                return { key, tracker };
            }
        }
        return null;
    }

    // Get NPC within interaction range of player
    getNearbyNPC(player, npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return null;
        const dist = tileDistance({ col: player.col, row: player.row }, { col: npc.col, row: npc.row });
        return dist <= 3 ? npc : null;
    }

    // Get world item within pickup range
    getNearbyItem(player, itemId) {
        const item = this.worldItems.get(itemId);
        if (!item) return null;
        const dist = tileDistance({ col: player.col, row: player.row }, { col: item.col, row: item.row });
        return dist <= 2 ? item : null;
    }

    addChatMessage(playerId, playerName, message) {
        const msg = {
            id: generateId(),
            playerId,
            playerName,
            message: message.substring(0, 200), // Limit length
            timestamp: Date.now(),
        };
        this.chatHistory.push(msg);
        if (this.chatHistory.length > 100) {
            this.chatHistory.shift();
        }
        return msg;
    }

    getWorldState() {
        return {
            players: Array.from(this.players.values()).map(p => p.toPublic()),
            npcs: Array.from(this.npcs.values()).map(n => n.toPublic()),
            items: Array.from(this.worldItems.values()).map(i => i.toPublic()),
            chatHistory: this.chatHistory.slice(-20),
            survival: {
                time: this.survival.time,
                brightness: this.survival.brightness,
                dynamicTiles: Object.fromEntries(this.survival.dynamicTiles)
            }
        };
    }
}
