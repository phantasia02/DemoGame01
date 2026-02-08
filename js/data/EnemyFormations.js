// Enemy formations define how enemies are placed in the 3x3 grid
export const FORMATIONS = {
    goblin_small: {
        enemies: [
            { type: 'goblin', row: 1, col: 1 },
        ]
    },
    goblin_pair: {
        enemies: [
            { type: 'goblin', row: 0, col: 1 },
            { type: 'goblin', row: 2, col: 1 },
        ]
    },
    goblin_squad: {
        enemies: [
            { type: 'goblin', row: 0, col: 0 },
            { type: 'goblin', row: 1, col: 1 },
            { type: 'goblin', row: 2, col: 2 },
        ]
    },
    skeleton_guard: {
        enemies: [
            { type: 'skeleton', row: 1, col: 0 },
            { type: 'skeleton', row: 1, col: 2 },
        ]
    },
    skeleton_line: {
        enemies: [
            { type: 'skeleton', row: 0, col: 1 },
            { type: 'skeleton', row: 1, col: 1 },
            { type: 'skeleton', row: 2, col: 1 },
        ]
    },
    slime_cluster: {
        enemies: [
            { type: 'slime', row: 0, col: 0 },
            { type: 'slime', row: 0, col: 2 },
            { type: 'slime', row: 2, col: 1 },
        ]
    },
    slime_single: {
        enemies: [
            { type: 'slime', row: 1, col: 1 },
        ]
    },
    mixed_squad: {
        enemies: [
            { type: 'goblin', row: 0, col: 0 },
            { type: 'skeleton', row: 1, col: 1 },
            { type: 'slime', row: 2, col: 2 },
        ]
    }
};

// Map enemy type to possible formations
export const TYPE_FORMATIONS = {
    goblin: ['goblin_small', 'goblin_pair', 'goblin_squad'],
    skeleton: ['skeleton_guard', 'skeleton_line'],
    slime: ['slime_cluster', 'slime_single'],
};

export function getRandomFormation(enemyType) {
    const options = TYPE_FORMATIONS[enemyType] || ['goblin_small'];
    return FORMATIONS[options[Math.floor(Math.random() * options.length)]];
}
