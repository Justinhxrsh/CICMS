import { v4 as uuidv4 } from 'uuid';
import { WORLD_MAP, WALKABLE_TILES, GAME } from './constants.js';

// Generate a UUID
export function generateId() {
    return uuidv4();
}

// Calculate distance between two tile positions
export function tileDistance(a, b) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

// Pixel to tile conversion
export function pixelToTile(px, py) {
    return {
        col: Math.floor(px / GAME.TILE_SIZE),
        row: Math.floor(py / GAME.TILE_SIZE),
    };
}

// Tile to pixel (center of tile)
export function tileToPixel(col, row) {
    return {
        x: col * GAME.TILE_SIZE + GAME.TILE_SIZE / 2,
        y: row * GAME.TILE_SIZE + GAME.TILE_SIZE / 2,
    };
}

// Check if a tile is walkable
export function isTileWalkable(col, row) {
    if (col < 0 || row < 0 || col >= GAME.MAP_COLS || row >= GAME.MAP_ROWS) return false;
    const tile = WORLD_MAP[row][col];
    return WALKABLE_TILES.has(tile);
}

// Simple A* pathfinding
export function findPath(startCol, startRow, endCol, endRow) {
    if (!isTileWalkable(endCol, endRow)) return [];

    const openSet = new Map();
    const closedSet = new Set();
    const startKey = `${startCol},${startRow}`;
    const endKey = `${endCol},${endRow}`;

    const startNode = {
        col: startCol,
        row: startRow,
        g: 0,
        h: Math.abs(endCol - startCol) + Math.abs(endRow - startRow),
        parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.set(startKey, startNode);

    const dirs = [
        { dc: 0, dr: -1 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 },
        // Diagonals (optional, more natural movement)
        // { dc: 1, dr: -1 }, { dc: 1, dr: 1 }, { dc: -1, dr: 1 }, { dc: -1, dr: -1 },
    ];

    let iterations = 0;
    const MAX_ITER = 500;

    while (openSet.size > 0 && iterations < MAX_ITER) {
        iterations++;

        // Find lowest f
        let current = null;
        let lowestF = Infinity;
        for (const [, node] of openSet) {
            if (node.f < lowestF) {
                lowestF = node.f;
                current = node;
            }
        }

        const currKey = `${current.col},${current.row}`;

        if (currKey === endKey) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ col: node.col, row: node.row });
                node = node.parent;
            }
            return path;
        }

        openSet.delete(currKey);
        closedSet.add(currKey);

        for (const dir of dirs) {
            const nc = current.col + dir.dc;
            const nr = current.row + dir.dr;
            const nKey = `${nc},${nr}`;

            if (closedSet.has(nKey) || !isTileWalkable(nc, nr)) continue;

            const g = current.g + 1;
            const h = Math.abs(endCol - nc) + Math.abs(endRow - nr);
            const f = g + h;

            if (openSet.has(nKey)) {
                const existing = openSet.get(nKey);
                if (g < existing.g) {
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                }
            } else {
                openSet.set(nKey, { col: nc, row: nr, g, h, f, parent: current });
            }
        }
    }

    return [];
}

// Clamp a value between min and max
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Random integer between min and max (inclusive)
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick a random element from an array
export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Send a WebSocket message safely
export function sendMessage(ws, data) {
    if (ws && ws.readyState === 1) { // WebSocket.OPEN
        try {
            ws.send(JSON.stringify(data));
        } catch (e) {
            console.error('Failed to send WS message:', e.message);
        }
    }
}

// XP to level calculation (level = floor(sqrt(xp/100)) + 1)
export function xpToLevel(xp) {
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

// Level to XP requirement
export function levelToXp(level) {
    return (level - 1) * (level - 1) * 100;
}
