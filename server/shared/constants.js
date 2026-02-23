// Game constants shared between client and server
export const GAME = {
    MAP_COLS: 40,
    MAP_ROWS: 32,
    TILE_SIZE: 32,
    MAP_WIDTH: 40 * 32,   // 1280px
    MAP_HEIGHT: 32 * 32,  // 1024px
    PLAYER_SPEED: 2.5,    // tiles per second
    NPC_SPEED: 1.0,
    SYNC_INTERVAL: 100,   // ms
    TICK_RATE: 50,        // ms per server tick
    MAX_INVENTORY: 28,
    MAX_GOLD: 9999999,
};

// Tile types
export const TILES = {
    GRASS: 0,
    WATER: 1,
    MOUNTAIN: 2,
    TREE: 3,
    PATH: 4,
    WALL: 5,
    MINE: 6,
    BANK: 7,
    SHOP: 8,
    SAND: 9,
    FLOWER: 10,
};

// Walkable tiles
export const WALKABLE_TILES = new Set([
    TILES.GRASS,
    TILES.PATH,
    TILES.SHOP,
    TILES.BANK,
    TILES.SAND,
    TILES.FLOWER,
]);

// Item definitions
export const ITEM_DEFS = {
    // Weapons
    IRON_SWORD: {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        slot: 'weapon',
        value: 150,
        stats: { attack: 8 },
        color: '#aaaacc',
        emoji: '⚔️',
    },
    BRONZE_DAGGER: {
        id: 'bronze_dagger',
        name: 'Bronze Dagger',
        type: 'weapon',
        slot: 'weapon',
        value: 60,
        stats: { attack: 4 },
        color: '#cc9966',
        emoji: '🗡️',
    },
    STEEL_SWORD: {
        id: 'steel_sword',
        name: 'Steel Sword',
        type: 'weapon',
        slot: 'weapon',
        value: 350,
        stats: { attack: 15 },
        color: '#ccddee',
        emoji: '⚔️',
    },
    // Armor
    LEATHER_ARMOR: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        slot: 'chest',
        value: 120,
        stats: { defense: 5 },
        color: '#aa7744',
        emoji: '🧥',
    },
    IRON_SHIELD: {
        id: 'iron_shield',
        name: 'Iron Shield',
        type: 'armor',
        slot: 'offhand',
        value: 100,
        stats: { defense: 8 },
        color: '#888899',
        emoji: '🛡️',
    },
    IRON_HELMET: {
        id: 'iron_helmet',
        name: 'Iron Helmet',
        type: 'armor',
        slot: 'head',
        value: 80,
        stats: { defense: 3 },
        color: '#999abb',
        emoji: '⛑️',
    },
    IRON_BOOTS: {
        id: 'iron_boots',
        name: 'Iron Boots',
        type: 'armor',
        slot: 'feet',
        value: 70,
        stats: { defense: 2 },
        color: '#888899',
        emoji: '👢',
    },
    // Tools
    PICKAXE: {
        id: 'pickaxe',
        name: 'Pickaxe',
        type: 'tool',
        slot: 'tool',
        value: 200,
        stats: { mining: 5 },
        color: '#887766',
        emoji: '⛏️',
    },
    FISHING_ROD: {
        id: 'fishing_rod',
        name: 'Fishing Rod',
        type: 'tool',
        slot: 'tool',
        value: 150,
        stats: { fishing: 5 },
        color: '#446688',
        emoji: '🎣',
    },
    // Resources
    GOLD_ORE: {
        id: 'gold_ore',
        name: 'Gold Ore',
        type: 'resource',
        value: 80,
        stackable: true,
        color: '#ddbb22',
        emoji: '🪨',
    },
    IRON_ORE: {
        id: 'iron_ore',
        name: 'Iron Ore',
        type: 'resource',
        value: 40,
        stackable: true,
        color: '#887777',
        emoji: '🪨',
    },
    COAL: {
        id: 'coal',
        name: 'Coal',
        type: 'resource',
        value: 25,
        stackable: true,
        color: '#333333',
        emoji: '🪨',
    },
    RAW_FISH: {
        id: 'raw_fish',
        name: 'Raw Fish',
        type: 'resource',
        value: 30,
        stackable: true,
        color: '#66aacc',
        emoji: '🐟',
    },
    // Consumables
    BREAD: {
        id: 'bread',
        name: 'Bread',
        type: 'consumable',
        value: 20,
        stackable: true,
        heals: 10,
        color: '#ddaa55',
        emoji: '🍞',
    },
    HEALTH_POTION: {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        value: 50,
        stackable: true,
        heals: 30,
        color: '#dd4444',
        emoji: '🧪',
    },
    // Bones
    BONES: {
        id: 'bones',
        name: 'Bones',
        type: 'resource',
        value: 5,
        stackable: true,
        color: '#eeeecc',
        emoji: '🦴',
    },
};

// NPC definitions
export const NPC_DEFS = {
    MERCHANT: {
        id: 'merchant',
        name: 'Gareth the Merchant',
        type: 'shop',
        color: '#4488cc',
        emoji: '🧔',
        shop: ['IRON_SWORD', 'BRONZE_DAGGER', 'LEATHER_ARMOR', 'IRON_SHIELD', 'BREAD', 'HEALTH_POTION', 'PICKAXE'],
        dialog: 'Welcome to my shop, adventurer! I have fine goods.',
    },
    BANKER: {
        id: 'banker',
        name: 'Millicent the Banker',
        type: 'bank',
        color: '#ddaa44',
        emoji: '👩',
        dialog: 'Welcome to the Delaford Bank. Your items are safe with us.',
    },
    GUARD: {
        id: 'guard',
        name: 'Town Guard',
        type: 'dialog',
        color: '#558844',
        emoji: '💂',
        dialog: 'Stay out of trouble in Delaford, citizen.',
    },
    BLACKSMITH: {
        id: 'blacksmith',
        name: 'Erik the Blacksmith',
        type: 'shop',
        color: '#cc6633',
        emoji: '🧑',
        shop: ['IRON_SWORD', 'STEEL_SWORD', 'IRON_HELMET', 'IRON_BOOTS', 'IRON_SHIELD', 'PICKAXE'],
        dialog: 'Looking for quality arms and armor? You\'ve come to the right place!',
    },
    FISHERMAN: {
        id: 'fisherman',
        name: 'Old Tom the Fisherman',
        type: 'shop',
        color: '#226688',
        emoji: '🧓',
        shop: ['FISHING_ROD', 'RAW_FISH', 'BREAD'],
        dialog: 'Fishing is the most peaceful trade in all of Delaford.',
    },
};

// Shop inventories - NPC shop item IDs with buy prices
export const SHOP_BUY_MARKUP = 1.5; // Players pay 150% of item value
export const SHOP_SELL_DISCOUNT = 0.5; // Players sell for 50% of item value

// Respawn zones
export const RESPAWN_ZONES = {
    IRON_MINE: {
        id: 'iron_mine',
        col: 5, row: 5,
        radius: 3,
        items: ['IRON_ORE', 'COAL'],
        cooldown: 8000,
        requiredTool: 'pickaxe',
        xpPerGather: 15,
        skillType: 'mining',
    },
    GOLD_MINE: {
        id: 'gold_mine',
        col: 8, row: 3,
        radius: 2,
        items: ['GOLD_ORE'],
        cooldown: 15000,
        requiredTool: 'pickaxe',
        xpPerGather: 35,
        skillType: 'mining',
    },
    FISHING_SPOT: {
        id: 'fishing_spot',
        col: 2, row: 18,
        radius: 2,
        items: ['RAW_FISH'],
        cooldown: 6000,
        requiredTool: 'fishing_rod',
        xpPerGather: 12,
        skillType: 'fishing',
    },
    GRAVEYARD: {
        id: 'graveyard',
        col: 34, row: 26,
        radius: 3,
        items: ['BONES'],
        cooldown: 10000,
        xpPerGather: 5,
        skillType: null,
    },
};

// The game map (40 cols x 32 rows)
// 0=grass, 1=water, 2=mountain, 3=tree, 4=path, 5=wall, 6=mine, 7=bank, 8=shop, 9=sand, 10=flower
export const WORLD_MAP = [
    // Row 0
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    // Row 1
    [2, 6, 6, 0, 0, 6, 6, 0, 6, 2, 2, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 2
    [2, 6, 6, 0, 0, 6, 6, 0, 6, 2, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 3
    [2, 0, 0, 0, 0, 0, 0, 0, 6, 2, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 4
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 5
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 6
    [2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2],
    // Row 7
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 8
    [2, 0, 3, 3, 0, 0, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 4, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 9
    [2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 4, 0, 0, 5, 8, 8, 5, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 10
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 5, 8, 8, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 2],
    // Row 11
    [2, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 2],
    // Row 12
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 13
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 14
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 5, 5, 5, 5, 0, 0, 5, 5, 5, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 15
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 4, 0, 5, 7, 7, 5, 0, 0, 5, 8, 8, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 16
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 5, 7, 7, 5, 0, 0, 5, 8, 8, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 17
    [1, 0, 0, 0, 10, 10, 0, 0, 0, 0, 0, 0, 0, 4, 0, 5, 5, 5, 5, 0, 0, 5, 5, 5, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 18
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 2],
    // Row 19
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 2],
    // Row 20
    [1, 1, 1, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 2],
    // Row 21
    [2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 22
    [2, 2, 1, 1, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 23
    [2, 2, 2, 1, 1, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 24
    [2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 2],
    // Row 25
    [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2],
    // Row 26
    [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 2],
    // Row 27
    [2, 2, 2, 2, 2, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 2],
    // Row 28
    [2, 2, 2, 2, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 29
    [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 30
    [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 31
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];

// Player spawn position
export const SPAWN = { col: 19, row: 10 };

// XP table: levels 1-99
export const XP_TABLE = Array.from({ length: 100 }, (_, i) => Math.floor(i * i * 100));

export const SKILLS = ['mining', 'fishing', 'smithing', 'cooking', 'combat'];
