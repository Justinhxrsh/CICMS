"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clamp = clamp;
exports.findPath = findPath;
exports.generateId = generateId;
exports.isTileWalkable = isTileWalkable;
exports.levelToXp = levelToXp;
exports.pixelToTile = pixelToTile;
exports.randomChoice = randomChoice;
exports.randomInt = randomInt;
exports.sendMessage = sendMessage;
exports.tileDistance = tileDistance;
exports.tileToPixel = tileToPixel;
exports.xpToLevel = xpToLevel;
var _uuid = require("uuid");
var _constants = require("./constants.js");
// Generate a UUID
function generateId() {
  return (0, _uuid.v4)();
}

// Calculate distance between two tile positions
function tileDistance(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

// Pixel to tile conversion
function pixelToTile(px, py) {
  return {
    col: Math.floor(px / _constants.GAME.TILE_SIZE),
    row: Math.floor(py / _constants.GAME.TILE_SIZE)
  };
}

// Tile to pixel (center of tile)
function tileToPixel(col, row) {
  return {
    x: col * _constants.GAME.TILE_SIZE + _constants.GAME.TILE_SIZE / 2,
    y: row * _constants.GAME.TILE_SIZE + _constants.GAME.TILE_SIZE / 2
  };
}

// Check if a tile is walkable
function isTileWalkable(col, row) {
  if (col < 0 || row < 0 || col >= _constants.GAME.MAP_COLS || row >= _constants.GAME.MAP_ROWS) return false;
  const tile = _constants.WORLD_MAP[row][col];
  return _constants.WALKABLE_TILES.has(tile);
}

// Simple A* pathfinding
function findPath(startCol, startRow, endCol, endRow, customIsWalkable = null) {
  const isWalkable = customIsWalkable || isTileWalkable;
  let targetCol = endCol;
  let targetRow = endRow;
  if (!isWalkable(targetCol, targetRow)) {
    // Find nearest walkable tile to target within a small radius
    let found = false;
    let bestDist = Infinity;
    let bestCol = startCol,
      bestRow = startRow;
    const SEARCH_RADIUS = 3;
    for (let dr = -SEARCH_RADIUS; dr <= SEARCH_RADIUS; dr++) {
      for (let dc = -SEARCH_RADIUS; dc <= SEARCH_RADIUS; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nc = targetCol + dc;
        const nr = targetRow + dr;
        if (isWalkable(nc, nr)) {
          const distToPlayer = Math.abs(startCol - nc) + Math.abs(startRow - nr);
          const distToTarget = Math.abs(targetCol - nc) + Math.abs(targetRow - nr);
          // Favor tiles that are close to where we clicked, then close to us
          const score = distToTarget * 2 + distToPlayer;
          if (score < bestDist) {
            bestDist = score;
            bestCol = nc;
            bestRow = nr;
            found = true;
          }
        }
      }
    }
    if (!found) return [];
    targetCol = bestCol;
    targetRow = bestRow;
  }
  if (startCol === targetCol && startRow === targetRow) return [];
  const openSet = [];
  const openSetMap = new Map(); // For fast lookup
  const closedSet = new Set();
  const startKey = `${startCol},${startRow}`;
  const endKey = `${targetCol},${targetRow}`;
  const startNode = {
    col: startCol,
    row: startRow,
    g: 0,
    h: Math.abs(targetCol - startCol) + Math.abs(targetRow - startRow),
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);
  openSetMap.set(startKey, startNode);
  const dirs = [{
    dc: 0,
    dr: -1
  }, {
    dc: 1,
    dr: 0
  }, {
    dc: 0,
    dr: 1
  }, {
    dc: -1,
    dr: 0
  }];
  let iterations = 0;
  const MAX_ITER = 10000;
  while (openSet.length > 0 && iterations < MAX_ITER) {
    iterations++;

    // Get node with lowest f
    // Sort is overkill for small lists but faster than linear scan in some cases if we pop
    // Better: linear scan but minimize calls
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) {
        lowestIdx = i;
      }
    }
    const current = openSet.splice(lowestIdx, 1)[0];
    const currKey = `${current.col},${current.row}`;
    openSetMap.delete(currKey);
    if (currKey === endKey) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node) {
        path.unshift({
          col: node.col,
          row: node.row
        });
        node = node.parent;
      }
      return path;
    }
    closedSet.add(currKey);
    for (const dir of dirs) {
      const nc = current.col + dir.dc;
      const nr = current.row + dir.dr;
      const nKey = `${nc},${nr}`;
      if (closedSet.has(nKey) || !isWalkable(nc, nr)) continue;
      const g = current.g + 1;
      const h = Math.abs(targetCol - nc) + Math.abs(targetRow - nr);
      const f = g + h;
      const existing = openSetMap.get(nKey);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        const newNode = {
          col: nc,
          row: nr,
          g,
          h,
          f,
          parent: current
        };
        openSet.push(newNode);
        openSetMap.set(nKey, newNode);
      }
    }
  }
  return [];
}

// Clamp a value between min and max
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick a random element from an array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Send a WebSocket message safely
function sendMessage(ws, data) {
  if (ws && ws.readyState === 1) {
    // WebSocket.OPEN
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {
      console.error('Failed to send WS message:', e.message);
    }
  }
}

// XP to level calculation (level = floor(sqrt(xp/100)) + 1)
function xpToLevel(xp) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

// Level to XP requirement
function levelToXp(level) {
  return (level - 1) * (level - 1) * 100;
}