import { generateId, tileToPixel, xpToLevel } from '../shared/utils.js';
import { GAME, ITEM_DEFS, SPAWN, SKILLS } from '../shared/constants.js';

export class Player {
    constructor(id, name, ws) {
        this.id = id;
        this.name = name;
        this.ws = ws;

        // Position (tile-based)
        this.col = SPAWN.col + Math.floor(Math.random() * 3) - 1;
        this.row = SPAWN.row + Math.floor(Math.random() * 3) - 1;

        // Pixel position (for smooth interpolation)
        const px = tileToPixel(this.col, this.row);
        this.x = px.x;
        this.y = px.y;

        // Movement
        this.path = [];         // Array of {col, row} waypoints
        this.pathIndex = 0;
        this.moving = false;
        this.direction = 'south';
        this.pendingAction = null;

        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 50;
        this.maxMana = 50;
        this.gold = 500;        // Starting gold
        this.attack = 5;
        this.defense = 2;
        this.hunger = 100;      // Hunger (0-100)
        this.maxHunger = 100;
        this.hungerTimer = 0;

        // Skills (XP values)
        this.skills = {};
        SKILLS.forEach(skill => {
            this.skills[skill] = 0;
        });

        // Inventory (array of item instances)
        this.inventory = [];

        // Equipment slots
        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            feet: null,
            weapon: null,
            offhand: null,
        };

        // Bank storage
        this.bank = [];

        // State
        this.isOnline = true;
        this.lastActivity = Date.now();
        this.joinedAt = Date.now();

        // Give starter items
        this.addItem('BREAD', 5);
        this.addItem('HEALTH_POTION', 2);
        this.addItem('IRON_SWORD', 1);
        this.addItem('WOODEN_AXE', 1);
    }

    // Add an item to inventory
    addItem(itemDefKey, quantity = 1) {
        const def = ITEM_DEFS[itemDefKey];
        if (!def) return false;
        if (this.inventory.length >= GAME.MAX_INVENTORY && !def.stackable) return false;

        if (def.stackable) {
            const existing = this.inventory.find(i => i.defKey === itemDefKey);
            if (existing) {
                existing.quantity += quantity;
                return true;
            }
        }

        if (this.inventory.length >= GAME.MAX_INVENTORY) return false;

        this.inventory.push({
            id: generateId(),
            defKey: itemDefKey,
            name: def.name,
            type: def.type,
            slot: def.slot || null,
            value: def.value,
            stats: def.stats || {},
            emoji: def.emoji || '📦',
            color: def.color || '#888888',
            stackable: def.stackable || false,
            quantity: quantity,
        });
        return true;
    }

    // Remove item from inventory (returns removed item or false)
    removeItem(itemId, quantity = 1) {
        const idx = this.inventory.findIndex(i => i.id === itemId);
        if (idx === -1) return false;

        const item = this.inventory[idx];
        if (item.stackable) {
            if (item.quantity < quantity) return false;
            item.quantity -= quantity;
            if (item.quantity === 0) {
                this.inventory.splice(idx, 1);
            }
        } else {
            this.inventory.splice(idx, 1);
        }
        return item;
    }

    // Equip an item
    equip(itemId) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item || !item.slot) return { success: false, message: 'Item cannot be equipped.' };

        // Unequip existing item in that slot
        if (this.equipment[item.slot]) {
            this.inventory.push(this.equipment[item.slot]);
        }

        // Remove from inventory and equip
        const idx = this.inventory.findIndex(i => i.id === itemId);
        this.inventory.splice(idx, 1);
        this.equipment[item.slot] = item;

        // Recalculate stats
        this.calculateStats();

        return { success: true, message: `Equipped ${item.name}.` };
    }

    // Unequip an item
    unequip(slot) {
        if (!this.equipment[slot]) return { success: false, message: 'Nothing equipped in that slot.' };
        if (this.inventory.length >= GAME.MAX_INVENTORY) {
            return { success: false, message: 'Inventory full.' };
        }

        this.inventory.push(this.equipment[slot]);
        this.equipment[slot] = null;
        this.calculateStats();

        return { success: true, message: 'Item unequipped.' };
    }

    // Recalculate attack/defense from equipment
    calculateStats() {
        this.attack = 5;
        this.defense = 2;
        for (const item of Object.values(this.equipment)) {
            if (!item) continue;
            if (item.stats.attack) this.attack += item.stats.attack;
            if (item.stats.defense) this.defense += item.stats.defense;
        }
    }

    // Gain skill XP
    gainXp(skill, amount) {
        if (!SKILLS.includes(skill)) return;
        const oldLevel = xpToLevel(this.skills[skill]);
        this.skills[skill] += amount;
        const newLevel = xpToLevel(this.skills[skill]);
        if (newLevel > oldLevel) {
            return { levelUp: true, skill, level: newLevel };
        }
        return { levelUp: false };
    }

    // Consume a consumable item
    consume(itemId) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item || item.type !== 'consumable') return { success: false, message: 'Cannot consume that item.' };

        const def = ITEM_DEFS[item.defKey];
        if (def) {
            if (def.heals) {
                this.health = Math.min(this.maxHealth, this.health + def.heals);
            }
            // Restore hunger (most foods restore 20-40)
            const hungerRestore = def.heals ? def.heals : 20;
            this.hunger = Math.min(this.maxHunger, this.hunger + hungerRestore);
        }

        this.removeItem(itemId, 1);
        return { success: true, message: `Used ${item.name}. HP/Hunger restored.` };
    }

    // Periodic tick for health regen and hunger
    tick(deltaMs) {
        let changed = false;
        this.hungerTimer += deltaMs;

        // Hunger drops every 10 seconds (10000ms)
        if (this.hungerTimer >= 10000) {
            this.hungerTimer = 0;
            if (this.hunger > 0) {
                this.hunger -= 1;
                changed = true;
            } else {
                // Starvation damage
                this.health = Math.max(0, this.health - 2);
                changed = true;
            }

            // Passive health regen if full
            if (this.hunger > 80 && this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + 1);
                changed = true;
            }
        }

        return changed;
    }

    // Set movement path
    setPath(path) {
        this.path = path;
        this.pathIndex = 0;
        this.moving = path.length > 0;
    }

    // Update movement tick (called on server tick)
    update(deltaMs) {
        if (!this.moving || this.path.length === 0) return false;

        const target = this.path[this.pathIndex];
        if (!target) {
            this.moving = false;
            return false;
        }

        const targetPx = tileToPixel(target.col, target.row);
        const dx = targetPx.x - this.x;
        const dy = targetPx.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const speed = GAME.PLAYER_SPEED * GAME.TILE_SIZE * (deltaMs / 1000);

        if (dist <= speed) {
            // Reached tile
            this.x = targetPx.x;
            this.y = targetPx.y;
            this.col = target.col;
            this.row = target.row;
            this.pathIndex++;

            if (this.pathIndex >= this.path.length) {
                this.moving = false;
                this.path = [];
                this.pathIndex = 0;
            }

            // Update direction
            this.updateDirection(dx, dy);
            return true;
        } else {
            // Move towards target
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
            this.updateDirection(dx, dy);
            return true;
        }
    }

    updateDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'east' : 'west';
        } else {
            this.direction = dy > 0 ? 'south' : 'north';
        }
    }

    // Get public player data (sent to all clients)
    toPublic() {
        return {
            id: this.id,
            name: this.name,
            col: this.col,
            row: this.row,
            x: this.x,
            y: this.y,
            direction: this.direction,
            moving: this.moving,
            health: this.health,
            maxHealth: this.maxHealth,
            hunger: this.hunger,
            maxHunger: this.maxHunger,
        };
    }

    // Get private player data (sent only to this player)
    toPrivate() {
        return {
            ...this.toPublic(),
            gold: this.gold,
            mana: this.mana,
            maxMana: this.maxMana,
            attack: this.attack,
            defense: this.defense,
            skills: this.skills,
            inventory: this.inventory,
            equipment: this.equipment,
            bank: this.bank,
        };
    }
}
