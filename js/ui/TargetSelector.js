import { GRID_POSITIONS, GRID_CELL_SIZE, GRID_GAP, GRID_SIZE } from '../battle/BattleRenderer.js';

/**
 * TargetSelector allows player to pick a target unit across grids
 */
export class TargetSelector {
    constructor() {
        this.visible = false;
        this.targets = [];
        this.selectedIndex = 0;
        this.blinkTimer = 0;
    }

    open(targets) {
        this.visible = true;
        this.targets = targets.filter(t => t.alive);
        this.selectedIndex = 0;
        this.blinkTimer = 0;
    }

    close() {
        this.visible = false;
        this.targets = [];
    }

    handleInput(input) {
        if (!this.visible || this.targets.length === 0) return null;

        if (input.isJustPressed('ArrowLeft') || input.isJustPressed('ArrowUp')) {
            this.selectedIndex = (this.selectedIndex - 1 + this.targets.length) % this.targets.length;
        }
        if (input.isJustPressed('ArrowRight') || input.isJustPressed('ArrowDown')) {
            this.selectedIndex = (this.selectedIndex + 1) % this.targets.length;
        }

        if (input.confirm) {
            const target = this.targets[this.selectedIndex];
            this.close();
            return target;
        }

        if (input.cancel) {
            this.close();
            return '_cancel';
        }

        return null;
    }

    update(dt) {
        this.blinkTimer += dt;
    }

    render(ctx) {
        if (!this.visible || this.targets.length === 0) return;

        const blink = Math.floor(this.blinkTimer / 200) % 2 === 0;

        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            const isSelected = i === this.selectedIndex;

            if (isSelected && blink) {
                // Draw highlight around selected target
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    target.screenX - GRID_CELL_SIZE / 2 - 2,
                    target.screenY - GRID_CELL_SIZE / 2 - 2,
                    GRID_CELL_SIZE + 4,
                    GRID_CELL_SIZE + 4
                );

                // Arrow above
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.moveTo(target.screenX, target.screenY - GRID_CELL_SIZE / 2 - 12);
                ctx.lineTo(target.screenX - 6, target.screenY - GRID_CELL_SIZE / 2 - 20);
                ctx.lineTo(target.screenX + 6, target.screenY - GRID_CELL_SIZE / 2 - 20);
                ctx.closePath();
                ctx.fill();

                // Target name
                ctx.fillStyle = '#f1c40f';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(target.name, target.screenX, target.screenY - GRID_CELL_SIZE / 2 - 24);
                ctx.fillText(`HP: ${target.hp}/${target.maxHp}`, target.screenX, target.screenY + GRID_CELL_SIZE / 2 + 16);
            } else if (!isSelected) {
                // Dim indicator for non-selected targets
                ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    target.screenX - GRID_CELL_SIZE / 2 - 1,
                    target.screenY - GRID_CELL_SIZE / 2 - 1,
                    GRID_CELL_SIZE + 2,
                    GRID_CELL_SIZE + 2
                );
            }
        }

        // Instructions
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(350, 455, 260, 20);
        ctx.fillStyle = '#f1c40f';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← → 選擇目標 | Z確認 | X取消', 480, 469);
    }
}
