"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Delaford = void 0;
var _ws = _interopRequireWildcard(require("ws"));
var _world = require("./core/world.js");
var _player = require("./core/player.js");
var _combat = require("./core/combat.js");
var _utils = require("./shared/utils.js");
var _constants = require("./shared/constants.js");
var _economy = require("./core/economy.js");
var _survival = require("./core/survival.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
class Delaford {
  constructor(httpServer) {
    this.world = new _world.World();
    this.combat = new _combat.Combat(this.world);
    this.economy = new _economy.GameEconomy(this.world);
    this.bankCommands = new _economy.BankCommands(this.economy);
    this.survivalCommands = new _survival.SurvivalCommands(this.world.survival);
    this.wss = new _ws.Server({
      server: httpServer
    });
    this.setupWebSocket();
    this.startGameLoop();
    console.log('[Delaford] Game server initialized!');
  }
  setupWebSocket() {
    this.wss.on('connection', ws => {
      ws.playerId = null;
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      ws.on('message', rawData => {
        try {
          const data = JSON.parse(rawData.toString());
          this.handleMessage(ws, data);
        } catch (e) {
          console.error('[WS] Bad message:', e.message);
        }
      });
      ws.on('close', () => {
        if (ws.playerId) {
          this.handleDisconnect(ws.playerId);
        }
      });
      ws.on('error', err => {
        console.error('[WS] Socket error:', err.message);
      });
    });

    // Heartbeat - disconnect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
    console.log('[Delaford] WebSocket server ready');
  }
  handleMessage(ws, data) {
    const {
      type
    } = data;
    switch (type) {
      case 'JOIN_GAME':
        this.handleJoin(ws, data);
        break;
      case 'MOVE':
        this.handleMove(ws, data);
        break;
      case 'ACTION':
        this.handleAction(ws, data);
        break;
      case 'INTERACT':
        this.handleInteract(ws, data);
        break;
      case 'CHAT':
        this.handleChat(ws, data);
        break;
      case 'EQUIP':
        this.handleEquip(ws, data);
        break;
      case 'UNEQUIP':
        this.handleUnequip(ws, data);
        break;
      case 'CONSUME':
        this.handleConsume(ws, data);
        break;
      case 'BANK_ACTION':
        this.handleBankAction(ws, data);
        break;
      case 'GATHER':
        this.handleGather(ws, data);
        break;
      case 'WEBRTC_SIGNAL':
        this.handleWebRTCSignal(ws, data);
        break;
      default:
        (0, _utils.sendMessage)(ws, {
          type: 'ERROR',
          message: `Unknown message type: ${type}`
        });
    }
  }
  handleWebRTCSignal(ws, data) {
    if (!ws.playerId) return;
    const {
      targetId,
      signal
    } = data;
    const targetPlayer = this.world.players.get(targetId);
    if (targetPlayer && targetPlayer.ws.readyState === _ws.default.OPEN) {
      (0, _utils.sendMessage)(targetPlayer.ws, {
        type: 'WEBRTC_SIGNAL',
        sourceId: ws.playerId,
        signal
      });
    }
  }
  handleJoin(ws, data) {
    const {
      playerName
    } = data;
    if (!playerName || playerName.length < 2 || playerName.length > 20) {
      (0, _utils.sendMessage)(ws, {
        type: 'ERROR',
        message: 'Invalid player name (2-20 chars).'
      });
      return;
    }

    // Check name not already taken
    for (const p of this.world.players.values()) {
      if (p.name.toLowerCase() === playerName.toLowerCase()) {
        (0, _utils.sendMessage)(ws, {
          type: 'ERROR',
          message: 'Name already taken. Choose another.'
        });
        return;
      }
    }
    const playerId = (0, _utils.generateId)();
    ws.playerId = playerId;
    const player = new _player.Player(playerId, playerName, ws);
    this.world.players.set(playerId, player);
    console.log(`[Delaford] Player joined: ${playerName} (${playerId})`);

    // Send world state to new player
    const worldState = this.world.getWorldState();
    (0, _utils.sendMessage)(ws, {
      type: 'JOIN_SUCCESS',
      player: player.toPrivate(),
      worldState
    });

    // Broadcast new player to others
    this.broadcast({
      type: 'PLAYER_JOINED',
      player: player.toPublic()
    }, playerId);

    // Send welcome message
    this.addActionLog(ws, `Welcome to Delaford, ${playerName}! Use right-click for actions.`);
  }
  handleDisconnect(playerId) {
    const player = this.world.players.get(playerId);
    if (!player) return;
    console.log(`[Delaford] Player left: ${player.name}`);
    this.world.players.delete(playerId);
    this.broadcast({
      type: 'PLAYER_LEFT',
      playerId,
      playerName: player.name
    });
  }
  handleMove(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const {
      targetCol,
      targetRow
    } = data;
    const path = (0, _utils.findPath)(player.col, player.row, targetCol, targetRow);
    if (path.length === 0) {
      (0, _utils.sendMessage)(ws, {
        type: 'ACTION_RESULT',
        success: false,
        message: 'Cannot reach that location.'
      });
      return;
    }
    player.path = path;
    player.pathIndex = 0;
    player.moving = true;
    player.pendingAction = null; // Clear queued action if player moves manually

    (0, _utils.sendMessage)(ws, {
      type: 'MOVE_ACK',
      path
    });
  }
  queueAction(player, targetCol, targetRow, maxDist, actionData) {
    const dist = (0, _utils.tileDistance)({
      col: player.col,
      row: player.row
    }, {
      col: targetCol,
      row: targetRow
    });
    if (dist <= maxDist) {
      return true;
    } else {
      const path = (0, _utils.findPath)(player.col, player.row, targetCol, targetRow);
      if (path.length > 0) {
        player.path = path;
        player.pathIndex = 0;
        player.moving = true;
        player.pendingAction = actionData;
        (0, _utils.sendMessage)(player.ws, {
          type: 'MOVE_ACK',
          path
        });
      } else {
        this.sendActionResult(player.ws, false, 'Cannot reach that location.');
      }
      return false;
    }
  }
  handleAction(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const {
      action,
      targetId,
      itemId,
      quantity
    } = data;
    switch (action) {
      case 'BUY_ITEM':
        {
          const npc = this.world.npcs.get(targetId);
          if (!npc) return this.sendActionResult(ws, false, 'NPC not found.');
          if (!this.queueAction(player, npc.col, npc.row, 3, data)) return;
          const result = npc.processBuy(player, itemId, quantity || 1);
          this.sendActionResult(ws, result.success, result.message);
          if (result.success) this.sendInventoryUpdate(ws, player);
          break;
        }
      case 'SELL_ITEM':
        {
          const npc = this.world.npcs.get(targetId);
          if (!npc) return this.sendActionResult(ws, false, 'NPC not found.');
          if (!this.queueAction(player, npc.col, npc.row, 3, data)) return;
          const result = npc.processSell(player, itemId, quantity || 1);
          this.sendActionResult(ws, result.success, result.message);
          if (result.success) this.sendInventoryUpdate(ws, player);
          break;
        }
      case 'COMMAND':
        {
          this.handleCommand(ws, data);
          break;
        }
      default:
        (0, _utils.sendMessage)(ws, {
          type: 'ERROR',
          message: `Unknown action: ${action}`
        });
    }
  }
  handleCommand(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const {
      command,
      args
    } = data;
    if (command === 'give') {
      var _args$;
      const itemId = (_args$ = args[0]) === null || _args$ === void 0 ? void 0 : _args$.toUpperCase();
      const amount = parseInt(args[1] || '1', 10);
      if (!itemId || !_constants.ITEM_DEFS[itemId]) {
        return this.sendActionResult(ws, false, `Invalid item: ${args[0]}`);
      }
      if (isNaN(amount) || amount <= 0 || amount > 1000) {
        return this.sendActionResult(ws, false, `Invalid amount: ${args[1]}`);
      }
      let added = 0;
      for (let i = 0; i < amount; i++) {
        if (player.addItem(itemId)) {
          added++;
        } else {
          break;
        }
      }
      this.sendInventoryUpdate(ws, player);
      if (added > 0) {
        this.sendActionResult(ws, true, `Gave ${added}x ${_constants.ITEM_DEFS[itemId].name}.`);
      } else {
        this.sendActionResult(ws, false, 'Inventory full.');
      }
    } else if (command === 'tp') {
      const col = parseInt(args[0], 10);
      const row = parseInt(args[1], 10);
      if (isNaN(col) || isNaN(row) || col < 0 || col >= _constants.GAME.MAP_COLS || row < 0 || row >= _constants.GAME.MAP_ROWS) {
        return this.sendActionResult(ws, false, `Invalid coordinates.`);
      }
      // Add a little check for basic bounds
      player.col = col;
      player.row = row;
      player.path = []; // stop moving
      this.sendActionResult(ws, true, `Teleported to ${col}, ${row}.`);

      // Immediately broadcast our movement to everyone else
      this.broadcast({
        type: 'WORLD_UPDATE',
        players: [player.toPublic()],
        npcs: [],
        items: []
      });
      // And update explicitly our position to ourselves
      (0, _utils.sendMessage)(ws, {
        type: 'WORLD_UPDATE',
        players: [player.toPublic()],
        npcs: [],
        items: []
      });
    } else if (command === 'help') {
      this.sendActionResult(ws, true, 'Commands: /give <item_id> [amount], /tp <x> <y>, /bank, /shop, /time, /place, /mine, /dig, /house');
    } else if (command === 'bank' || command === 'shop') {
      const commandStr = `${command} ${args.join(' ')}`;
      const result = this.bankCommands.handleCommand(player, commandStr);
      this.sendActionResult(ws, true, result);
      this.sendInventoryUpdate(ws, player);
    } else if (['time', 'place', 'mine', 'dig', 'house'].includes(command)) {
      const commandStr = `/${command} ${args.join(' ')}`;
      const result = this.survivalCommands.handleCommand(player, commandStr);
      this.sendActionResult(ws, true, result);
      this.sendInventoryUpdate(ws, player);
    } else {
      this.sendActionResult(ws, false, `Unknown command: ${command}`);
    }
  }
  handleInteract(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const {
      targetId,
      targetType
    } = data;
    if (targetType === 'npc') {
      const npc = this.world.npcs.get(targetId);
      if (!npc) return this.sendActionResult(ws, false, 'NPC not found.');
      if (!this.queueAction(player, npc.col, npc.row, 3, data)) return;
      (0, _utils.sendMessage)(ws, {
        type: 'INTERACT_RESULT',
        targetType: 'npc',
        npc: npc.toPublic()
      });
    } else if (targetType === 'item') {
      // Pick up world item
      const item = this.world.worldItems.get(targetId);
      if (!item) return this.sendActionResult(ws, false, 'Item not found.');
      if (!this.queueAction(player, item.col, item.row, 2, data)) return;
      if (player.addItem(item.defKey)) {
        this.world.worldItems.delete(item.id);

        // Find and mark respawn
        const zone = this.world.findRespawnZone(item.id);
        if (zone) zone.tracker.itemGathered(item.id);
        this.broadcast({
          type: 'ITEM_REMOVED',
          itemId: item.id
        });
        this.sendInventoryUpdate(ws, player);
        this.sendActionResult(ws, true, `Picked up ${item.name}.`);
      } else {
        this.sendActionResult(ws, false, 'Inventory full.');
      }
    }
  }
  handleGather(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const {
      worldItemId,
      zoneKey
    } = data;
    const zoneDef = _constants.RESPAWN_ZONES[zoneKey];
    if (!zoneDef) return this.sendActionResult(ws, false, 'Invalid resource zone.');
    if (!this.queueAction(player, zoneDef.col, zoneDef.row, zoneDef.radius + 3, data)) return;

    // Check required tool
    if (zoneDef.requiredTool) {
      const hasTool = player.inventory.some(i => i.defKey === zoneDef.requiredTool.toUpperCase()) || Object.values(player.equipment).some(i => i && i.defKey === zoneDef.requiredTool.toUpperCase());
      if (!hasTool) {
        return this.sendActionResult(ws, false, `You need a ${zoneDef.requiredTool} to gather here.`);
      }
    }

    // Find the item in the world
    const tracker = this.world.respawnTrackers.get(zoneKey);
    if (!tracker) return this.sendActionResult(ws, false, 'Zone not found.');
    const worldItem = tracker.items[0]; // Take first available item in zone
    if (!worldItem) {
      return this.sendActionResult(ws, false, 'Nothing to gather here. Wait for respawn.');
    }

    // Add to player inventory
    if (!player.addItem(worldItem.defKey)) {
      return this.sendActionResult(ws, false, 'Inventory full.');
    }

    // Remove from world and schedule respawn
    this.world.worldItems.delete(worldItem.id);
    tracker.itemGathered(worldItem.id);
    this.broadcast({
      type: 'ITEM_REMOVED',
      itemId: worldItem.id
    });

    // Award XP
    let xpResult = null;
    if (zoneDef.skillType && zoneDef.xpPerGather) {
      xpResult = player.gainXp(zoneDef.skillType, zoneDef.xpPerGather);
    }
    this.sendInventoryUpdate(ws, player);
    this.sendActionResult(ws, true, `Gathered ${worldItem.name}! (+${zoneDef.xpPerGather || 0} XP)`);
    if (xpResult && xpResult.levelUp) {
      (0, _utils.sendMessage)(ws, {
        type: 'LEVEL_UP',
        skill: xpResult.skill,
        level: xpResult.level,
        message: `🎉 Level Up! ${xpResult.skill} is now level ${xpResult.level}!`
      });
    }
  }
  handleChat(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const message = (data.message || '').trim();
    if (!message || message.length === 0) return;
    const chatMsg = this.world.addChatMessage(player.id, player.name, message);
    this.broadcast({
      type: 'CHAT_MESSAGE',
      ...chatMsg
    });
  }
  handleEquip(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const result = player.equip(data.itemId);
    this.sendActionResult(ws, result.success, result.message);
    if (result.success) this.sendInventoryUpdate(ws, player);
  }
  handleUnequip(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const result = player.unequip(data.slot);
    this.sendActionResult(ws, result.success, result.message);
    if (result.success) this.sendInventoryUpdate(ws, player);
  }
  handleConsume(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const result = player.consume(data.itemId);
    this.sendActionResult(ws, result.success, result.message);
    if (result.success) this.sendInventoryUpdate(ws, player);
  }
  handleBankAction(ws, data) {
    const player = this.world.players.get(ws.playerId);
    if (!player) return;
    const {
      npcId,
      action,
      itemId,
      quantity
    } = data;
    const npc = this.world.npcs.get(npcId);
    if (!npc) return this.sendActionResult(ws, false, 'NPC not found.');
    if (!this.queueAction(player, npc.col, npc.row, 3, data)) return;
    const result = npc.processBank(player, action, itemId, quantity);
    this.sendActionResult(ws, result.success, result.message);
    if (result.success) this.sendInventoryUpdate(ws, player);
  }

  // Send inventory/gold update to a player
  sendInventoryUpdate(ws, player) {
    (0, _utils.sendMessage)(ws, {
      type: 'INVENTORY_UPDATED',
      inventory: player.inventory,
      equipment: player.equipment,
      gold: player.gold,
      skills: player.skills,
      health: player.health,
      maxHealth: player.maxHealth,
      mana: player.mana,
      maxMana: player.maxMana,
      bank: player.bank
    });
  }
  sendActionResult(ws, success, message) {
    (0, _utils.sendMessage)(ws, {
      type: 'ACTION_RESULT',
      success,
      message
    });
  }
  addActionLog(ws, message) {
    (0, _utils.sendMessage)(ws, {
      type: 'ACTION_LOG',
      message
    });
  }

  // Broadcast to all connected clients except optionally one
  broadcast(data, excludePlayerId = null) {
    const msg = JSON.stringify(data);
    this.wss.clients.forEach(client => {
      if (client.readyState === _ws.default.OPEN) {
        if (excludePlayerId && client.playerId === excludePlayerId) return;
        client.send(msg);
      }
    });
  }

  // Main game loop
  startGameLoop() {
    let lastSync = Date.now();
    const SYNC_INTERVAL = _constants.GAME.SYNC_INTERVAL;
    this.gameLoopInterval = setInterval(() => {
      const {
        updatedNPCs,
        updatedPlayers
      } = this.world.tick();
      const now = Date.now();

      // Economy update (interest)
      if (now % 60000 < _constants.GAME.TICK_RATE) {
        // Roughly every minute for interest check/listings
        this.economy.applyInterest();
        this.economy.checkExpiredListings();
      }

      // Check for arrived queued actions
      for (const player of this.world.players.values()) {
        if (!player.moving && player.pendingAction) {
          const action = player.pendingAction;
          player.pendingAction = null;
          if (player.ws && player.ws.readyState === _ws.default.OPEN) {
            this.handleMessage(player.ws, action);
          }
        }
      }
      if (now - lastSync >= SYNC_INTERVAL) {
        lastSync = now;

        // Broadcast new world item spawns
        const currentItems = Array.from(this.world.worldItems.values()).map(i => i.toPublic());
        if (updatedPlayers.length > 0 || updatedNPCs.length > 0) {
          this.broadcast({
            type: 'WORLD_UPDATE',
            players: updatedPlayers,
            npcs: updatedNPCs,
            items: currentItems
          });
        }
      }
    }, _constants.GAME.TICK_RATE);
    console.log('[Delaford] Game loop started');
  }
  stop() {
    clearInterval(this.gameLoopInterval);
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}
exports.Delaford = Delaford;