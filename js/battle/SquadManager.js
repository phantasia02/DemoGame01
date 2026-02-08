import { BattleGrid } from './BattleGrid.js';
import { BattleUnit } from './BattleUnit.js';
import { ENEMY_UNITS } from '../data/UnitDefinitions.js';

/**
 * SquadManager handles the 5 grids layout:
 * - center: player party
 * - front: enemies from below (initial encounter)
 * - back: enemies from above
 * - left: enemies from left
 * - right: enemies from right
 */
export class SquadManager {
    constructor() {
        this.grids = {
            center: new BattleGrid('center'),
            front: new BattleGrid('front'),
            back: new BattleGrid('back'),
            left: new BattleGrid('left'),
            right: new BattleGrid('right'),
        };

        this.grids.center.active = true;
        this.grids.front.active = true;
    }

    setupPlayerParty(partyData) {
        const grid = this.grids.center;
        for (const pData of partyData) {
            const unit = new BattleUnit(pData, 'player', 'center');
            grid.place(unit, unit.gridRow, unit.gridCol);
        }
    }

    addEnemySquad(direction, formation) {
        const grid = this.grids[direction];
        if (!grid) return [];

        grid.active = true;
        grid.entering = true;
        grid.slideOffset = 1.0; // animate from 100% offset

        const units = [];
        for (const enemyDef of formation.enemies) {
            const baseDef = ENEMY_UNITS[enemyDef.type];
            if (!baseDef) continue;

            const unit = new BattleUnit(
                { ...baseDef, type: enemyDef.type, row: enemyDef.row, col: enemyDef.col },
                'enemy',
                direction
            );
            if (grid.place(unit, enemyDef.row, enemyDef.col)) {
                units.push(unit);
            }
        }
        return units;
    }

    getAllUnits() {
        const units = [];
        for (const grid of Object.values(this.grids)) {
            units.push(...grid.getUnits());
        }
        return units;
    }

    getAllAliveUnits() {
        return this.getAllUnits().filter(u => u.alive);
    }

    getPlayerUnits() {
        return this.grids.center.getAliveUnits();
    }

    getEnemyUnits() {
        const enemies = [];
        for (const [dir, grid] of Object.entries(this.grids)) {
            if (dir === 'center') continue;
            enemies.push(...grid.getAliveUnits());
        }
        return enemies;
    }

    hasAliveEnemies() {
        for (const [dir, grid] of Object.entries(this.grids)) {
            if (dir === 'center') continue;
            if (grid.hasAliveUnits()) return true;
        }
        return false;
    }

    hasAlivePlayers() {
        return this.grids.center.hasAliveUnits();
    }

    getActiveDirections() {
        const dirs = [];
        for (const [dir, grid] of Object.entries(this.grids)) {
            if (grid.active && grid.hasAliveUnits()) {
                dirs.push(dir);
            }
        }
        return dirs;
    }

    removeDeadFromGrids() {
        for (const grid of Object.values(this.grids)) {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (grid.cells[r][c] && !grid.cells[r][c].alive) {
                        grid.cells[r][c] = null;
                    }
                }
            }
        }
    }

    updateAnimations(dt) {
        for (const grid of Object.values(this.grids)) {
            if (grid.entering && grid.slideOffset > 0) {
                grid.slideOffset -= dt / 500; // 500ms entrance animation
                if (grid.slideOffset <= 0) {
                    grid.slideOffset = 0;
                    grid.entering = false;
                }
            }
        }
    }
}
