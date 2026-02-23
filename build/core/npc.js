"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NPC = void 0;
var _utils = require("../shared/utils.js");
var _constants = require("../shared/constants.js");
class NPC {
  constructor(defKey, col, row) {
    this.id = (0, _utils.generateId)();
    this.defKey = defKey;
    const def = _constants.NPC_DEFS[defKey];
    this.name = def.name;
    this.type = def.type; // 'shop', 'bank', 'dialog'
    this.color = def.color;
    this.emoji = def.emoji;
    this.dialog = def.dialog;

    // Position
    this.col = col;
    this.row = row;
    this.homeCol = col;
    this.homeRow = row;
    const px = (0, _utils.tileToPixel)(col, row);
    this.x = px.x;
    this.y = px.y;

    // Shop inventory (key = item defKey, value = stock quantity)
    this.shopItems = [];
    if (def.shop) {
      def.shop.forEach(itemKey => {
        const itemDef = _constants.ITEM_DEFS[itemKey];
        this.shopItems.push({
          defKey: itemKey,
          name: itemDef.name,
          emoji: itemDef.emoji,
          color: itemDef.color,
          type: itemDef.type,
          buyPrice: Math.ceil(itemDef.value * _constants.SHOP_BUY_MARKUP),
          sellPrice: Math.floor(itemDef.value * _constants.SHOP_SELL_DISCOUNT),
          stock: 999 // Unlimited stock
        });
      });
    }

    // Movement
    this.path = [];
    this.pathIndex = 0;
    this.moving = false;
    this.direction = 'south';
    this.wanderTimer = 0;
    this.WANDER_INTERVAL = 3000 + Math.random() * 4000;
    this.WANDER_RADIUS = 3;
  }

  // Wander randomly around home position
  updateWander(deltaMs) {
    this.wanderTimer += deltaMs;
    if (this.wanderTimer >= this.WANDER_INTERVAL) {
      this.wanderTimer = 0;
      this.WANDER_INTERVAL = 3000 + Math.random() * 4000;

      // Pick a random nearby tile to walk to
      const attempts = 5;
      for (let i = 0; i < attempts; i++) {
        const newCol = this.homeCol + Math.floor(Math.random() * (this.WANDER_RADIUS * 2 + 1)) - this.WANDER_RADIUS;
        const newRow = this.homeRow + Math.floor(Math.random() * (this.WANDER_RADIUS * 2 + 1)) - this.WANDER_RADIUS;
        if ((0, _utils.isTileWalkable)(newCol, newRow)) {
          const path = (0, _utils.findPath)(this.col, this.row, newCol, newRow);
          if (path.length > 1) {
            this.path = path;
            this.pathIndex = 1; // Skip first (current position)
            this.moving = true;
          }
          break;
        }
      }
    }
    if (!this.moving || this.path.length === 0) return false;
    const target = this.path[this.pathIndex];
    if (!target) {
      this.moving = false;
      return false;
    }
    const targetPx = (0, _utils.tileToPixel)(target.col, target.row);
    const dx = targetPx.x - this.x;
    const dy = targetPx.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = _constants.GAME.NPC_SPEED * _constants.GAME.TILE_SIZE * (deltaMs / 1000);
    if (dist <= speed) {
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
      this.updateDirection(dx, dy);
      return true;
    } else {
      this.x += dx / dist * speed;
      this.y += dy / dist * speed;
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

  // Process a buy transaction (player buys from NPC shop)
  processBuy(player, itemDefKey, quantity = 1) {
    if (this.type !== 'shop') {
      return {
        success: false,
        message: 'This NPC does not run a shop.'
      };
    }
    const shopEntry = this.shopItems.find(i => i.defKey === itemDefKey);
    if (!shopEntry) {
      return {
        success: false,
        message: 'Item not available in this shop.'
      };
    }
    const totalCost = shopEntry.buyPrice * quantity;
    if (player.gold < totalCost) {
      return {
        success: false,
        message: `Not enough gold. Need ${totalCost}g.`
      };
    }
    if (player.inventory.length >= _constants.GAME.MAX_INVENTORY) {
      const def = _constants.ITEM_DEFS[itemDefKey];
      if (!def.stackable) {
        return {
          success: false,
          message: 'Inventory full.'
        };
      }
    }
    player.gold -= totalCost;
    player.addItem(itemDefKey, quantity);
    return {
      success: true,
      message: `Bought ${quantity}x ${shopEntry.name} for ${totalCost}g.`,
      goldSpent: totalCost
    };
  }

  // Process a sell transaction (player sells to NPC)
  processSell(player, itemId, quantity = 1) {
    if (this.type !== 'shop') {
      return {
        success: false,
        message: 'This NPC does not buy items.'
      };
    }
    const item = player.inventory.find(i => i.id === itemId);
    if (!item) {
      return {
        success: false,
        message: 'Item not found in inventory.'
      };
    }
    const sellPrice = Math.floor(item.value * _constants.SHOP_SELL_DISCOUNT) * quantity;
    const removed = player.removeItem(itemId, quantity);
    if (!removed) {
      return {
        success: false,
        message: 'Could not remove item.'
      };
    }
    player.gold = Math.min(player.gold + sellPrice, _constants.GAME.MAX_GOLD);
    return {
      success: true,
      message: `Sold ${quantity}x ${item.name} for ${sellPrice}g.`,
      goldEarned: sellPrice
    };
  }

  // Process bank interaction
  processBank(player, action, itemId, quantity) {
    if (this.type !== 'bank') {
      return {
        success: false,
        message: 'This is not a bank.'
      };
    }
    if (action === 'DEPOSIT') {
      const item = player.inventory.find(i => i.id === itemId);
      if (!item) return {
        success: false,
        message: 'Item not found.'
      };
      const removed = player.removeItem(itemId, quantity || item.quantity);
      if (!removed) return {
        success: false,
        message: 'Failed to deposit.'
      };
      const existing = player.bank.find(i => i.defKey === item.defKey && item.stackable);
      if (existing) {
        existing.quantity += quantity || item.quantity;
      } else {
        player.bank.push({
          ...item,
          quantity: quantity || item.quantity
        });
      }
      return {
        success: true,
        message: `Deposited ${item.name}.`
      };
    }
    if (action === 'WITHDRAW') {
      const bankItem = player.bank.find(i => i.id === itemId);
      if (!bankItem) return {
        success: false,
        message: 'Item not in bank.'
      };
      if (player.inventory.length >= _constants.GAME.MAX_INVENTORY && !bankItem.stackable) {
        return {
          success: false,
          message: 'Inventory full.'
        };
      }
      const qty = quantity || bankItem.quantity;
      bankItem.quantity -= qty;
      if (bankItem.quantity <= 0) {
        const idx = player.bank.indexOf(bankItem);
        player.bank.splice(idx, 1);
      }
      player.addItem(bankItem.defKey, qty);
      return {
        success: true,
        message: `Withdrew ${bankItem.name}.`
      };
    }
    return {
      success: false,
      message: 'Unknown bank action.'
    };
  }
  toPublic() {
    return {
      id: this.id,
      defKey: this.defKey,
      name: this.name,
      type: this.type,
      color: this.color,
      emoji: this.emoji,
      dialog: this.dialog,
      col: this.col,
      row: this.row,
      x: this.x,
      y: this.y,
      direction: this.direction,
      moving: this.moving,
      shopItems: this.shopItems
    };
  }
}
exports.NPC = NPC;