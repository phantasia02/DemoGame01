import { MAP_TILES, MAP_WIDTH, MAP_HEIGHT, TILE_COLORS, TILE_WALKABLE } from '../data/MapData.js';

export class MiniMap {
    constructor() {
        this.x = 10;
        this.y = 10;
        this.width = 150;
        this.height = 100;
        this.tileW = this.width / MAP_WIDTH;
        this.tileH = this.height / MAP_HEIGHT;
        this.blinkTimer = 0;
    }

    update(dt) {
        this.blinkTimer += dt;
    }

    render(ctx, mapScene, playerTileX, playerTileY) {
        if (!mapScene) return;

        ctx.save();

        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        // 繪製地圖磁磚（縮小版）
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = MAP_TILES[y][x];
                const color = TILE_COLORS[tile];
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(
                    this.x + x * this.tileW,
                    this.y + y * this.tileH,
                    Math.ceil(this.tileW),
                    Math.ceil(this.tileH)
                );
            }
        }

        ctx.globalAlpha = 1.0;

        // 繪製敵人位置
        for (const enemy of mapScene.enemies) {
            const dotX = this.x + enemy.tileX * this.tileW + this.tileW / 2;
            const dotY = this.y + enemy.tileY * this.tileH + this.tileH / 2;
            const dotR = 2.5;

            if (!enemy.alive || enemy.state === 'dead') {
                // 已死亡：灰色點
                ctx.fillStyle = '#666';
                this._drawDot(ctx, dotX, dotY, dotR);
            } else if (enemy.state === 'in_battle') {
                // 已在戰鬥中：灰色點
                ctx.fillStyle = '#888';
                this._drawDot(ctx, dotX, dotY, dotR);
            } else if (enemy.state === 'approaching_battle') {
                // 正在接近戰鬥位置
                const dist = enemy.distanceTo(playerTileX, playerTileY);
                if (dist <= 2) {
                    // 即將到達：黃色閃爍
                    const blink = Math.sin(this.blinkTimer * 0.01) > 0;
                    ctx.fillStyle = blink ? '#ffff00' : '#ff8800';
                    this._drawDot(ctx, dotX, dotY, dotR + 0.5);
                } else {
                    // 移動中：橙色
                    ctx.fillStyle = '#ff8800';
                    this._drawDot(ctx, dotX, dotY, dotR);
                }
            } else {
                // 一般存活敵人：紅色點
                ctx.fillStyle = '#e74c3c';
                this._drawDot(ctx, dotX, dotY, dotR);
            }
        }

        // 繪製玩家位置（藍色點）
        const playerDotX = this.x + playerTileX * this.tileW + this.tileW / 2;
        const playerDotY = this.y + playerTileY * this.tileH + this.tileH / 2;
        ctx.fillStyle = '#3498db';
        this._drawDot(ctx, playerDotX, playerDotY, 3);

        // 邊框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

        // 標題
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('MAP', this.x + 2, this.y + this.height + 12);

        ctx.restore();
    }

    _drawDot(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}
