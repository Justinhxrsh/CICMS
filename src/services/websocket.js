import store from '../store';

const isProd = process.env.NODE_ENV === 'production';
const WS_HOST = window.location.hostname;
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';
// In dev, the server is on 6500. In prod, it's served on the same port as the frontend.
const WS_PORT = isProd ? window.location.port : 6500;
const WS_URL = `${WS_PROTOCOL}://${WS_HOST}${WS_PORT ? ':' + WS_PORT : ''}`;

class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectTimer = null;
        this.reconnectDelay = 2000;
        this.maxReconnectDelay = 30000;
        this.onMessageCallbacks = new Map();
        this.myPlayerId = null;
    }

    connect(playerName) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(WS_URL);

                this.ws.onopen = () => {
                    console.log('[WS] Connected to Delaford server');
                    store.commit('player/SET_CONNECTED', true);
                    this.reconnectDelay = 2000;

                    // Send join message
                    this.send({
                        type: 'JOIN_GAME',
                        playerName,
                    });
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data, resolve, reject);
                    } catch (e) {
                        console.error('[WS] Parse error:', e);
                    }
                };

                this.ws.onclose = () => {
                    console.log('[WS] Connection closed');
                    store.commit('player/SET_CONNECTED', false);
                    this.scheduleReconnect(playerName);
                };

                this.ws.onerror = (err) => {
                    console.error('[WS] Error:', err);
                    reject(new Error('Connection failed. Is the server running?'));
                };

            } catch (e) {
                reject(e);
            }
        });
    }

    handleMessage(data, joinResolve, joinReject) {
        const { type } = data;

        switch (type) {
            case 'JOIN_SUCCESS': {
                this.myPlayerId = data.player.id;
                store.dispatch('player/initPlayer', data.player);
                store.dispatch('inventory/updateInventory', {
                    items: data.player.inventory,
                    equipment: data.player.equipment,
                    bank: data.player.bank,
                });
                store.dispatch('world/setWorldState', data.worldState);
                store.dispatch('chat/setChatHistory', data.worldState.chatHistory);
                store.dispatch('chat/addActionLog', {
                    message: `Connected to Delaford! (${data.worldState.players.length} player(s) online)`,
                    type: 'success',
                });
                if (joinResolve) joinResolve(data.player);
                break;
            }

            case 'WORLD_UPDATE': {
                // Filter out our own data from others
                const otherPlayers = (data.players || []).filter(p => p.id !== this.myPlayerId);
                store.dispatch('world/updateWorld', {
                    players: otherPlayers,
                    npcs: data.npcs,
                    items: data.items,
                });

                // Update our own position if included
                const myData = (data.players || []).find(p => p.id === this.myPlayerId);
                if (myData) {
                    store.commit('player/SET_POSITION', myData);
                }
                break;
            }

            case 'PLAYER_JOINED': {
                if (data.player.id !== this.myPlayerId) {
                    store.dispatch('world/playerJoined', data.player);
                    store.dispatch('chat/addActionLog', {
                        message: `${data.player.name} joined the game.`,
                        type: 'info',
                    });
                }
                break;
            }

            case 'PLAYER_LEFT': {
                store.dispatch('world/playerLeft', data.playerId);
                store.dispatch('chat/addActionLog', {
                    message: `${data.playerName} left the game.`,
                    type: 'info',
                });
                break;
            }

            case 'INVENTORY_UPDATED': {
                store.dispatch('inventory/updateInventory', {
                    items: data.inventory,
                    equipment: data.equipment,
                    bank: data.bank,
                });
                store.dispatch('player/updateStats', {
                    gold: data.gold,
                    health: data.health,
                    maxHealth: data.maxHealth,
                    mana: data.mana,
                    maxMana: data.maxMana,
                });
                if (data.skills) {
                    store.dispatch('player/updateSkills', data.skills);
                }
                break;
            }

            case 'CHAT_MESSAGE': {
                store.dispatch('chat/addMessage', data);
                break;
            }

            case 'ACTION_RESULT': {
                store.dispatch('chat/addActionLog', {
                    message: data.message,
                    type: data.success ? 'success' : 'error',
                });
                // Emit custom event for components
                this.emit('ACTION_RESULT', data);
                break;
            }

            case 'ACTION_LOG': {
                store.dispatch('chat/addActionLog', {
                    message: data.message,
                    type: 'info',
                });
                break;
            }

            case 'INTERACT_RESULT': {
                if (data.targetType === 'npc') {
                    store.dispatch('world/interactWith', data.npc);
                }
                break;
            }

            case 'ITEM_REMOVED': {
                store.dispatch('world/removeWorldItem', data.itemId);
                break;
            }

            case 'MOVE_ACK': {
                // Path acknowledged - no action needed, server drives movement
                break;
            }

            case 'LEVEL_UP': {
                store.dispatch('chat/addActionLog', {
                    message: data.message,
                    type: 'levelup',
                });
                this.emit('LEVEL_UP', data);
                break;
            }

            case 'ERROR': {
                store.dispatch('chat/addActionLog', {
                    message: `Error: ${data.message}`,
                    type: 'error',
                });
                if (joinReject) joinReject(new Error(data.message));
                break;
            }

            default:
                // console.log('[WS] Unhandled message type:', type);
                break;
        }

        // Call any registered callbacks
        if (this.onMessageCallbacks.has(type)) {
            this.onMessageCallbacks.get(type).forEach(cb => cb(data));
        }
    }

    on(type, callback) {
        if (!this.onMessageCallbacks.has(type)) {
            this.onMessageCallbacks.set(type, []);
        }
        this.onMessageCallbacks.get(type).push(callback);
    }

    off(type, callback) {
        if (!this.onMessageCallbacks.has(type)) return;
        const cbs = this.onMessageCallbacks.get(type);
        const idx = cbs.indexOf(callback);
        if (idx !== -1) cbs.splice(idx, 1);
    }

    emit(type, data) {
        if (this.onMessageCallbacks.has(type)) {
            this.onMessageCallbacks.get(type).forEach(cb => cb(data));
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('[WS] Not connected, cannot send:', data.type);
        }
    }

    moveRequest(targetCol, targetRow) {
        this.send({ type: 'MOVE', targetCol, targetRow });
    }

    interact(targetId, targetType) {
        this.send({ type: 'INTERACT', targetId, targetType });
    }

    action(action, payload = {}) {
        this.send({ type: 'ACTION', action, ...payload });
    }

    chat(message) {
        this.send({ type: 'CHAT', message });
    }

    equip(itemId) {
        this.send({ type: 'EQUIP', itemId });
    }

    unequip(slot) {
        this.send({ type: 'UNEQUIP', slot });
    }

    consume(itemId) {
        this.send({ type: 'CONSUME', itemId });
    }

    bankAction(npcId, action, itemId, quantity) {
        this.send({ type: 'BANK_ACTION', npcId, action, itemId, quantity });
    }

    gather(worldItemId, zoneKey) {
        this.send({ type: 'GATHER', worldItemId, zoneKey });
    }

    scheduleReconnect(playerName) {
        if (this.reconnectTimer) return;
        store.dispatch('chat/addActionLog', {
            message: `Connection lost. Reconnecting in ${this.reconnectDelay / 1000}s...`,
            type: 'error',
        });
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
            if (playerName) {
                this.connect(playerName).catch(() => { });
            }
        }, this.reconnectDelay);
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    get isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

export const wsService = new WebSocketService();
export default wsService;
