import { TILE_SIZE } from '../data/MapData.js';

export class MapPlayer {
    constructor(tileX, tileY) {
        this.tileX = tileX;
        this.tileY = tileY;
        this.pixelX = tileX * TILE_SIZE + TILE_SIZE / 2;
        this.pixelY = tileY * TILE_SIZE + TILE_SIZE / 2;
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;
        this.moving = false;
        this.moveSpeed = 4; // tiles per second
        this.direction = 'down'; // 'up','down','left','right'
        this.size = TILE_SIZE - 4;

        // Animation
        this.animTimer = 0;
        this.animFrame = 0;
    }

    update(dt, input, tileMap) {
        this.animTimer += dt;
        if (this.animTimer > 200) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        if (this.moving) {
            // Interpolate to target
            const speed = this.moveSpeed * TILE_SIZE * (dt / 1000);
            const dx = this.targetPixelX - this.pixelX;
            const dy = this.targetPixelY - this.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= speed) {
                this.pixelX = this.targetPixelX;
                this.pixelY = this.targetPixelY;
                this.moving = false;
            } else {
                this.pixelX += (dx / dist) * speed;
                this.pixelY += (dy / dist) * speed;
            }
            return;
        }

        // Handle input for movement
        let newTileX = this.tileX;
        let newTileY = this.tileY;

        if (input.up) {
            newTileY--;
            this.direction = 'up';
        } else if (input.down) {
            newTileY++;
            this.direction = 'down';
        } else if (input.left) {
            newTileX--;
            this.direction = 'left';
        } else if (input.right) {
            newTileX++;
            this.direction = 'right';
        }

        if (newTileX !== this.tileX || newTileY !== this.tileY) {
            if (tileMap.isWalkable(newTileX, newTileY)) {
                this.tileX = newTileX;
                this.tileY = newTileY;
                this.targetPixelX = newTileX * TILE_SIZE + TILE_SIZE / 2;
                this.targetPixelY = newTileY * TILE_SIZE + TILE_SIZE / 2;
                this.moving = true;
            }
        }
    }

    render(ctx, camera) {
        const x = this.pixelX - camera.x;
        const y = this.pixelY - camera.y;
        const halfSize = this.size / 2;

        // Body
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(x - halfSize, y - halfSize, this.size, this.size);

        // Direction indicator (lighter front)
        ctx.fillStyle = '#66aaff';
        const inset = 4;
        switch (this.direction) {
            case 'up':
                ctx.fillRect(x - halfSize + inset, y - halfSize, this.size - inset * 2, this.size / 3);
                break;
            case 'down':
                ctx.fillRect(x - halfSize + inset, y + halfSize - this.size / 3, this.size - inset * 2, this.size / 3);
                break;
            case 'left':
                ctx.fillRect(x - halfSize, y - halfSize + inset, this.size / 3, this.size - inset * 2);
                break;
            case 'right':
                ctx.fillRect(x + halfSize - this.size / 3, y - halfSize + inset, this.size / 3, this.size - inset * 2);
                break;
        }

        // Eyes
        ctx.fillStyle = '#fff';
        const eyeOffset = this.animFrame === 1 ? 1 : 0;
        ctx.fillRect(x - 5, y - 4 + eyeOffset, 4, 4);
        ctx.fillRect(x + 2, y - 4 + eyeOffset, 4, 4);

        // Player label
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('P', x, y + halfSize + 12);
    }
}
