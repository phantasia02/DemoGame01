// Player job classes
export const PLAYER_UNITS = {
    warrior: {
        name: '戰士',
        job: 'warrior',
        hp: 320, mp: 40,
        attack: 45, defense: 35,
        magic: 10, magicDef: 15,
        speed: 100,
        color: '#e74c3c',
        abilities: ['attack', 'powerSlash', 'defend'],
    },
    mage: {
        name: '魔法師',
        job: 'mage',
        hp: 180, mp: 150,
        attack: 15, defense: 15,
        magic: 50, magicDef: 40,
        speed: 85,
        color: '#3498db',
        abilities: ['attack', 'fire', 'ice', 'thunder', 'defend'],
    },
    thief: {
        name: '盜賊',
        job: 'thief',
        hp: 240, mp: 60,
        attack: 35, defense: 20,
        magic: 15, magicDef: 20,
        speed: 140,
        color: '#2ecc71',
        abilities: ['attack', 'steal', 'doubleCut', 'defend'],
    },
    healer: {
        name: '白魔導',
        job: 'healer',
        hp: 200, mp: 180,
        attack: 12, defense: 20,
        magic: 45, magicDef: 45,
        speed: 90,
        color: '#f1c40f',
        abilities: ['attack', 'heal', 'healAll', 'defend'],
    },
};

// Enemy types
export const ENEMY_UNITS = {
    goblin: {
        name: '哥布林',
        hp: 120, mp: 0,
        attack: 25, defense: 12,
        magic: 5, magicDef: 8,
        speed: 95,
        color: '#27ae60',
        darkColor: '#1e8449',
        exp: 15, gold: 10,
        abilities: ['attack'],
    },
    skeleton: {
        name: '骷髏兵',
        hp: 180, mp: 20,
        attack: 30, defense: 25,
        magic: 10, magicDef: 5,
        speed: 75,
        color: '#bdc3c7',
        darkColor: '#95a5a6',
        exp: 25, gold: 18,
        abilities: ['attack', 'boneCrush'],
    },
    slime: {
        name: '史萊姆',
        hp: 80, mp: 10,
        attack: 15, defense: 8,
        magic: 12, magicDef: 15,
        speed: 60,
        color: '#8e44ad',
        darkColor: '#6c3483',
        exp: 10, gold: 8,
        abilities: ['attack', 'acidSpit'],
    },
};

// Default player party
export const DEFAULT_PARTY = [
    { ...PLAYER_UNITS.warrior, id: 'p1', gridPos: { row: 1, col: 1 } },
    { ...PLAYER_UNITS.mage, id: 'p2', gridPos: { row: 0, col: 1 } },
    { ...PLAYER_UNITS.thief, id: 'p3', gridPos: { row: 1, col: 0 } },
    { ...PLAYER_UNITS.healer, id: 'p4', gridPos: { row: 2, col: 1 } },
];
