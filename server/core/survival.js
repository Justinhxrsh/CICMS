import { ITEM_DEFS, TILES, WALKABLE_TILES } from '../shared/constants.js';
import { sendMessage, tileDistance } from '../shared/utils.js';

export class SurvivalSystem {
    constructor(world) {
        this.world = world;
        this.time = 6000; // Start at 6:00 AM
        this.day = 1;
        this.dynamicTiles = new Map(); // "col,row" -> tileType
        this.brightness = 1.0;
    }

    tick(deltaMs) {
        // Advance time: 1 Minecraft hour per 1 real second
        // 24000 ticks = 24 hours. 1000 ticks = 1 hour.
        // deltaMs / 1000 * 1000 = deltaMs.
        this.time += (deltaMs / 1000) * 200; // Accelerated for better testing (1 Minecraft hour every 5 real seconds)

        if (this.time >= 24000) {
            this.time = 0;
            this.day++;
        }

        this.updateBrightness();
    }

    updateBrightness() {
        if (this.time >= 0 && this.time < 6000) {
            this.brightness = 0.3 + (this.time / 6000) * 0.7;
        } else if (this.time >= 6000 && this.time < 12000) {
            this.brightness = 1.0;
        } else if (this.time >= 12000 && this.time < 18000) {
            const progress = (this.time - 12000) / 6000;
            this.brightness = 1.0 - (progress * 0.7);
        } else {
            this.brightness = 0.3;
        }
    }

    placeBlock(player, tileId, col, row) {
        const itemKey = tileId.toUpperCase();
        const def = ITEM_DEFS[itemKey];
        if (!def || def.type !== 'resource') return { success: false, message: "❌ Invalid block type!" };

        const dist = tileDistance({ col: player.col, row: player.row }, { col, row });
        if (dist > 5) return { success: false, message: "❌ Too far away to place!" };

        // Determine Tile Map ID
        // Map common resource items to tile types
        const itemToTile = {
            'WOOD': TILES.TREE,
            'STONE': TILES.MOUNTAIN, // Using mountains for stones
            'DIRT': TILES.GRASS,
            'WALL': TILES.WALL,
            'PATH': TILES.PATH
        };

        const tileType = itemToTile[itemKey] !== undefined ? itemToTile[itemKey] : TILES.WALL;

        if (player.removeItem(player.inventory.find(i => i.defKey === itemKey)?.id, 1)) {
            this.dynamicTiles.set(`${col},${row}`, tileType);
            return { success: true, message: `✅ Placed ${def.name}` };
        }
        return { success: false, message: "❌ You don't have that block!" };
    }

    breakBlock(player, col, row) {
        const dist = tileDistance({ col: player.col, row: player.row }, { col, row });
        if (dist > 5) return { success: false, message: "❌ Too far away to mine!" };

        const key = `${col},${row}`;
        if (!this.dynamicTiles.has(key)) return { success: false, message: "❌ Cannot break permanent map tiles!" };

        this.dynamicTiles.delete(key);
        // Maybe give item back?
        player.addItem('WOOD', 1);
        return { success: true, message: "⛏️ Mined block" };
    }

    dig(player, col, row) {
        const dist = tileDistance({ col: player.col, row: player.row }, { col, row });
        if (dist > 3) return { success: false, message: "❌ Too far away to dig!" };

        // Random survival loot table
        const rolls = Math.floor(Math.random() * 3) + 1;
        const loot = [];
        for (let i = 0; i < rolls; i++) {
            const r = Math.random();
            if (r < 0.05) loot.push('DIAMOND');
            else if (r < 0.15) loot.push('GOLD_ORE');
            else if (r < 0.40) loot.push('IRON_ORE');
            else loot.push('COAL');
        }

        loot.forEach(item => player.addItem(item, 1));
        return { success: true, message: `🕳️ Dug up: ${loot.join(', ')}` };
    }

    getTimeString() {
        const hour = Math.floor(this.time / 1000);
        const min = Math.floor((this.time % 1000) / 1000 * 60);
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    }
}

export class SurvivalCommands {
    constructor(survival) {
        this.survival = survival;
    }

    handleCommand(player, commandStr) {
        const parts = commandStr.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case '/time':
                if (args[0] === 'day') this.survival.time = 6000;
                if (args[0] === 'night') this.survival.time = 18000;
                return `⏰ Time: ${this.survival.getTimeString()} (Day ${this.survival.day})`;

            case '/place':
                return this.survival.placeBlock(player, args[0], parseInt(args[1]), parseInt(args[2])).message;

            case '/mine':
                return this.survival.breakBlock(player, parseInt(args[0]), parseInt(args[1])).message;

            case '/dig':
                return this.survival.dig(player, parseInt(args[0]), parseInt(args[1])).message;

            case '/house':
                // For direct command or context menu
                // args[0] could be size if provided, default small
                const size = args[0] === 'large' ? 5 : 3;
                const cost = size === 5 ? 20 : 10;

                const woodItem = player.inventory.find(i => i.defKey === 'WOOD');
                if (!woodItem || woodItem.quantity < cost) {
                    return `❌ Need ${cost} Wood to build this! (You have ${woodItem ? woodItem.quantity : 0})`;
                }

                // Simple box
                const offset = Math.floor(size / 2);
                const cx = player.col + 2;
                const cy = player.row - offset;

                if (player.removeItem(woodItem.id, cost)) {
                    for (let x = cx; x < cx + size; x++) {
                        for (let y = cy; y < cy + size; y++) {
                            // Walls
                            if (x === cx || x === cx + size - 1 || y === cy || y === cy + size - 1) {
                                // Leave a door
                                if (x === cx && y === Math.floor(cy + size / 2)) {
                                    this.survival.dynamicTiles.set(`${x},${y}`, TILES.PATH);
                                } else {
                                    this.survival.dynamicTiles.set(`${x},${y}`, TILES.WALL);
                                }
                            } else {
                                // Floor
                                this.survival.dynamicTiles.set(`${x},${y}`, TILES.PATH);
                            }
                        }
                    }
                    return `🏠 Built a ${size === 5 ? 'large' : 'small'} house (used ${cost} Wood)!`;
                }
                return "❌ Wood removal failed.";
        }
    }
}
