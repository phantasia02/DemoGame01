/**
 * BattleGrid manages a 3x3 grid of units
 */
export class BattleGrid {
    constructor(direction) {
        this.direction = direction; // 'center','front','back','left','right'
        this.cells = Array.from({ length: 3 }, () => Array(3).fill(null));
        this.active = false;
        this.slideOffset = 0; // for entrance animation
        this.entering = false;
    }

    place(unit, row, col) {
        if (row < 0 || row > 2 || col < 0 || col > 2) return false;
        if (this.cells[row][col]) return false;
        this.cells[row][col] = unit;
        unit.gridRow = row;
        unit.gridCol = col;
        return true;
    }

    remove(unit) {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (this.cells[r][c] === unit) {
                    this.cells[r][c] = null;
                    return true;
                }
            }
        }
        return false;
    }

    getUnits() {
        const units = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (this.cells[r][c]) {
                    units.push(this.cells[r][c]);
                }
            }
        }
        return units;
    }

    getAliveUnits() {
        return this.getUnits().filter(u => u.alive);
    }

    hasAliveUnits() {
        return this.getAliveUnits().length > 0;
    }

    isEmpty() {
        return this.getUnits().length === 0;
    }
}
