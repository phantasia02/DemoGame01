/**
 * BattleHUD draws the bottom panel with HP/MP/ATB bars for player units
 * Panel area: y 460~640 (180px tall)
 */

const PANEL_Y = 460;
const PANEL_HEIGHT = 180;

export class BattleHUD {
    constructor(width) {
        this.width = width;
        this.panelY = PANEL_Y;
        this.panelHeight = PANEL_HEIGHT;
    }

    render(ctx, squadManager, battleManager) {
        // Panel background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, this.panelY, this.width, this.panelHeight);

        // Top border
        ctx.fillStyle = '#334';
        ctx.fillRect(0, this.panelY, this.width, 2);

        // Player unit status (left side, 0~520)
        const players = squadManager.grids.center.getUnits().filter(u => u);
        const statusWidth = 520;
        const unitHeight = 40;
        const startY = this.panelY + 8;

        for (let i = 0; i < players.length; i++) {
            const unit = players[i];
            const uy = startY + i * unitHeight;

            // Highlight active unit
            if (battleManager.activeUnit === unit) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
                ctx.fillRect(8, uy - 2, statusWidth - 16, unitHeight - 2);
            }

            // Name
            ctx.fillStyle = unit.alive ? '#fff' : '#666';
            ctx.font = '14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(unit.name, 16, uy + 14);

            // HP
            const hpX = 100;
            const barWidth = 120;
            const barHeight = 10;

            ctx.fillStyle = '#666';
            ctx.font = '11px monospace';
            ctx.fillText('HP', hpX, uy + 14);
            this._drawBar(ctx, hpX + 24, uy + 4, barWidth, barHeight,
                unit.hp / unit.maxHp,
                unit.hp / unit.maxHp > 0.5 ? '#2ecc71' : unit.hp / unit.maxHp > 0.25 ? '#f39c12' : '#e74c3c');
            ctx.fillStyle = '#ddd';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${unit.hp}/${unit.maxHp}`, hpX + 24 + barWidth + 55, uy + 14);

            // MP
            const mpX = 310;
            ctx.fillStyle = '#666';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('MP', mpX, uy + 14);
            this._drawBar(ctx, mpX + 24, uy + 4, 80, barHeight,
                unit.maxMp > 0 ? unit.mp / unit.maxMp : 0, '#3498db');
            ctx.fillStyle = '#ddd';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${unit.mp}/${unit.maxMp}`, mpX + 24 + 80 + 50, uy + 14);

            // ATB bar
            const atbX = 480;
            ctx.fillStyle = '#666';
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';
            this._drawBar(ctx, atbX, uy + 4, 30, barHeight,
                unit.atb / unit.atbMax,
                unit.atbReady ? '#f1c40f' : '#7f8c8d');
        }

        // Battle log (right side, 530~960)
        this._drawBattleLog(ctx, battleManager);
    }

    _drawBar(ctx, x, y, width, height, ratio, color) {
        ratio = Math.max(0, Math.min(1, ratio));
        ctx.fillStyle = '#222';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * ratio, height);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    _drawBattleLog(ctx, battleManager) {
        const logX = 540;
        const logY = this.panelY + 10;
        const logWidth = 410;
        const logHeight = this.panelHeight - 20;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(logX, logY, logWidth, logHeight);
        ctx.strokeStyle = '#334';
        ctx.lineWidth = 1;
        ctx.strokeRect(logX, logY, logWidth, logHeight);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';

        const maxLines = 8;
        const logs = battleManager.battleLog.slice(-maxLines);
        for (let i = 0; i < logs.length; i++) {
            ctx.fillText(logs[i], logX + 8, logY + 16 + i * 18);
        }
    }
}

export { PANEL_Y, PANEL_HEIGHT };
