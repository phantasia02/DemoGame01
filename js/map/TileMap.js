import { MAP_TILES, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_COLORS, TILE_WALKABLE } from '../data/MapData.js';

export class TileMap {
    constructor() {
        this.tiles = MAP_TILES;
        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;
        this.tileSize = TILE_SIZE;
        this.pixelWidth = MAP_WIDTH * TILE_SIZE;
        this.pixelHeight = MAP_HEIGHT * TILE_SIZE;
    }

    getTile(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) return 1;
        return this.tiles[row][col];
    }

    isWalkable(col, row) {
        const tile = this.getTile(col, row);
        return TILE_WALKABLE[tile] || false;
    }

    render(ctx, camera) {
        const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
        const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
        const endCol = Math.min(this.width, Math.ceil((camera.x + camera.viewWidth) / this.tileSize));
        const endRow = Math.min(this.height, Math.ceil((camera.y + camera.viewHeight) / this.tileSize));

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tile = this.tiles[row][col];
                const x = col * this.tileSize - camera.x;
                const y = row * this.tileSize - camera.y;

                // Base tile color
                ctx.fillStyle = TILE_COLORS[tile] || '#000';
                ctx.fillRect(x, y, this.tileSize, this.tileSize);

                // Add detail patterns
                this._drawTileDetail(ctx, tile, x, y);

                // Grid lines (subtle)
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.strokeRect(x, y, this.tileSize, this.tileSize);
            }
        }
    }

    _drawTileDetail(ctx, tile, x, y) {
        const s = this.tileSize;
        switch (tile) {
            case 0: // grass - small dots
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(x + 8, y + 6, 2, 4);
                ctx.fillRect(x + 20, y + 18, 2, 4);
                ctx.fillRect(x + 14, y + 24, 2, 4);
                break;
            case 1: // wall - brick pattern
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y + s / 2);
                ctx.lineTo(x + s, y + s / 2);
                ctx.moveTo(x + s / 2, y);
                ctx.lineTo(x + s / 2, y + s / 2);
                ctx.moveTo(x, y + s / 2);
                ctx.lineTo(x, y + s);
                ctx.stroke();
                break;
            case 2: // water - wave lines
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 4, y + 10);
                ctx.quadraticCurveTo(x + 12, y + 6, x + 20, y + 10);
                ctx.moveTo(x + 8, y + 22);
                ctx.quadraticCurveTo(x + 16, y + 18, x + 26, y + 22);
                ctx.stroke();
                break;
            case 4: // tree - simple tree shape
                ctx.fillStyle = '#1a4a12';
                ctx.beginPath();
                ctx.moveTo(x + s / 2, y + 4);
                ctx.lineTo(x + s - 6, y + s - 8);
                ctx.lineTo(x + 6, y + s - 8);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(x + 13, y + s - 8, 6, 8);
                break;
        }
    }
}
