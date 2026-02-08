/**
 * BattleRenderer handles drawing the battle scene
 *
 * Layout (960x640):
 *        [back 3x3]          y: 20~150
 * [left 3x3] [center 3x3] [right 3x3]   y: 160~320
 *        [front 3x3]        y: 330~460
 * ──────────────────────────
 *   HUD panel               y: 470~640
 */

const GRID_CELL_SIZE = 44;
const GRID_GAP = 2;
const GRID_SIZE = GRID_CELL_SIZE * 3 + GRID_GAP * 2;

// Grid center positions
const GRID_POSITIONS = {
    center: { x: 480, y: 250 },
    front: { x: 480, y: 400 },
    back: { x: 480, y: 100 },
    left: { x: 260, y: 250 },
    right: { x: 700, y: 250 },
};

export class BattleRenderer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.battleAreaHeight = 460;
    }

    render(ctx, squadManager, battleManager) {
        // Background
        this._drawBackground(ctx);

        // Draw grids
        for (const [dir, grid] of Object.entries(squadManager.grids)) {
            if (!grid.active && grid.isEmpty()) continue;
            this._drawGrid(ctx, grid, dir, squadManager);
        }

        // Draw damage numbers
        for (const dn of battleManager.damageNumbers) {
            const alpha = 1 - (dn.timer / dn.duration);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = dn.color;
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(dn.value.toString(), dn.x, dn.y);
            ctx.globalAlpha = 1;
        }

        // Direction labels
        this._drawDirectionLabels(ctx, squadManager);
    }

    _drawBackground(ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, this.battleAreaHeight);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(0.5, '#16213e');
        grad.addColorStop(1, '#0f3460');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.battleAreaHeight);

        // Ground line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let y = 50; y < this.battleAreaHeight; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    _drawGrid(ctx, grid, direction, squadManager) {
        const pos = GRID_POSITIONS[direction];
        if (!pos) return;

        let offsetX = 0, offsetY = 0;
        if (grid.entering && grid.slideOffset > 0) {
            switch (direction) {
                case 'front': offsetY = grid.slideOffset * 200; break;
                case 'back': offsetY = -grid.slideOffset * 200; break;
                case 'left': offsetX = -grid.slideOffset * 200; break;
                case 'right': offsetX = grid.slideOffset * 200; break;
            }
        }

        const gridX = pos.x - GRID_SIZE / 2 + offsetX;
        const gridY = pos.y - GRID_SIZE / 2 + offsetY;

        // Grid background
        ctx.fillStyle = direction === 'center'
            ? 'rgba(50, 100, 200, 0.15)'
            : 'rgba(200, 50, 50, 0.15)';
        ctx.fillRect(gridX - 4, gridY - 4, GRID_SIZE + 8, GRID_SIZE + 8);

        // Grid border
        ctx.strokeStyle = direction === 'center'
            ? 'rgba(100, 150, 255, 0.4)'
            : 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX - 4, gridY - 4, GRID_SIZE + 8, GRID_SIZE + 8);

        // Cells
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cellX = gridX + c * (GRID_CELL_SIZE + GRID_GAP);
                const cellY = gridY + r * (GRID_CELL_SIZE + GRID_GAP);

                // Cell background
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(cellX, cellY, GRID_CELL_SIZE, GRID_CELL_SIZE);

                // Cell border
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, cellY, GRID_CELL_SIZE, GRID_CELL_SIZE);

                const unit = grid.cells[r][c];
                if (unit && unit.alive) {
                    this._drawUnit(ctx, unit, cellX, cellY);
                }
            }
        }
    }

    _drawUnit(ctx, unit, cellX, cellY) {
        const cx = cellX + GRID_CELL_SIZE / 2;
        const cy = cellY + GRID_CELL_SIZE / 2;

        // Update screen position for damage numbers
        unit.screenX = cx;
        unit.screenY = cy;

        const shakeX = unit.shakeX > 0 ? (Math.random() - 0.5) * unit.shakeX : 0;
        const drawX = cx + shakeX;

        // Flash effect
        if (unit.flashTimer > 0 && Math.floor(unit.flashTimer / 50) % 2 === 0) {
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = unit.color;
        }

        if (unit.isPlayer) {
            this._drawPlayerUnit(ctx, unit, drawX, cy);
        } else {
            this._drawEnemyUnit(ctx, unit, drawX, cy);
        }

        // HP bar
        const barWidth = GRID_CELL_SIZE - 4;
        const barHeight = 3;
        const barX = cellX + 2;
        const barY = cellY + GRID_CELL_SIZE - 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const hpRatio = unit.hp / unit.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        // Defending indicator
        if (unit.defending) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(drawX, cy, 18, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    _drawPlayerUnit(ctx, unit, cx, cy) {
        // Body - rounded square
        const size = 16;
        ctx.fillRect(cx - size, cy - size, size * 2, size * 2);

        // Helmet / job indicator
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(cx - size + 2, cy - size, size * 2 - 4, 6);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 6, cy - 4, 4, 4);
        ctx.fillRect(cx + 3, cy - 4, 4, 4);

        // Name (small)
        ctx.fillStyle = '#fff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name.slice(0, 3), cx, cy + size + 9);
    }

    _drawEnemyUnit(ctx, unit, cx, cy) {
        const size = 14;

        if (unit.type === 'slime') {
            // Blob shape
            ctx.beginPath();
            ctx.ellipse(cx, cy, size, size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (unit.type === 'skeleton') {
            // Skull-ish
            ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(cx - 8, cy - 2, 6, 8);
            ctx.fillRect(cx + 3, cy - 2, 6, 8);
        } else {
            // Generic enemy
            ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
        }

        // Eyes
        ctx.fillStyle = '#ff0';
        ctx.fillRect(cx - 6, cy - 6, 4, 4);
        ctx.fillRect(cx + 3, cy - 6, 4, 4);
    }

    _drawDirectionLabels(ctx, squadManager) {
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';

        const labels = {
            front: { text: '前方', x: 480, y: 450 },
            back: { text: '後方', x: 480, y: 55 },
            left: { text: '左方', x: 260, y: 200 },
            right: { text: '右方', x: 700, y: 200 },
            center: { text: '我方', x: 480, y: 200 },
        };

        for (const [dir, label] of Object.entries(labels)) {
            const grid = squadManager.grids[dir];
            if (!grid.active && grid.isEmpty()) continue;
            ctx.fillStyle = dir === 'center' ? 'rgba(100,150,255,0.7)' : 'rgba(255,100,100,0.7)';
            ctx.fillText(label.text, label.x, label.y);
        }
    }

    /**
     * Get unit at screen position (for target selection)
     */
    getUnitAtScreen(x, y, squadManager) {
        for (const [dir, grid] of Object.entries(squadManager.grids)) {
            if (!grid.active) continue;
            const pos = GRID_POSITIONS[dir];
            if (!pos) continue;

            const gridX = pos.x - GRID_SIZE / 2;
            const gridY = pos.y - GRID_SIZE / 2;

            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const unit = grid.cells[r][c];
                    if (!unit || !unit.alive) continue;

                    const cellX = gridX + c * (GRID_CELL_SIZE + GRID_GAP);
                    const cellY = gridY + r * (GRID_CELL_SIZE + GRID_GAP);

                    if (x >= cellX && x < cellX + GRID_CELL_SIZE &&
                        y >= cellY && y < cellY + GRID_CELL_SIZE) {
                        return unit;
                    }
                }
            }
        }
        return null;
    }
}

export { GRID_POSITIONS, GRID_CELL_SIZE, GRID_GAP, GRID_SIZE };
