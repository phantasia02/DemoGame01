import { TileMap } from './TileMap.js';
import { Camera } from './Camera.js';
import { MapPlayer } from './MapPlayer.js';
import { MapEnemy } from './MapEnemy.js';
import { PLAYER_START, ENEMY_SPAWNS, TILE_SIZE } from '../data/MapData.js';
import { getRandomFormation } from '../data/EnemyFormations.js';

export class MapScene {
    constructor(game) {
        this.game = game;
        this.tileMap = new TileMap();
        this.camera = new Camera(game.width, game.height);
        this.camera.setWorldBounds(this.tileMap.pixelWidth, this.tileMap.pixelHeight);

        this.player = new MapPlayer(PLAYER_START.x, PLAYER_START.y);
        this.enemies = [];
        this.battleActive = false;
        this.battleEnemies = []; // enemies currently in the battle

        this._spawnEnemies();
        this.camera.snapTo(this.player.pixelX, this.player.pixelY);
    }

    _spawnEnemies() {
        this.enemies = ENEMY_SPAWNS.map((spawn, i) => new MapEnemy(spawn, `enemy_${i}`));
    }

    enter(data) {
        this.battleActive = false;
        if (data && data.defeatedEnemies) {
            for (const id of data.defeatedEnemies) {
                const enemy = this.enemies.find(e => e.id === id);
                if (enemy) enemy.die();
            }
        }
        // Reset ATB for all enemies when returning to map
        for (const e of this.enemies) {
            if (e.alive && e.state === 'in_battle') {
                e.state = 'patrol';
            }
            e.atbValue = 0;
            e.atbReady = false;
        }
    }

    exit() {
        // nothing to clean up
    }

    update(dt) {
        if (this.game.transition) return;

        this.player.update(dt, this.game.input, this.tileMap);
        this.camera.follow(this.player.pixelX, this.player.pixelY, dt);

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(dt, this.player.tileX, this.player.tileY, this.tileMap, this.battleActive);

            // Check collision
            if (!this.battleActive && enemy.checkCollision(this.player.tileX, this.player.tileY)) {
                this._startBattle(enemy);
                return;
            }
        }
    }

    _startBattle(triggerEnemy) {
        this.battleActive = true;
        triggerEnemy.enterBattle();

        const formation = getRandomFormation(triggerEnemy.type);
        const direction = 'front'; // initial encounter is always from front

        const battleData = {
            squads: [{
                direction,
                formation,
                sourceEnemies: [triggerEnemy],
            }],
            mapScene: this,
            playerTileX: this.player.tileX,
            playerTileY: this.player.tileY,
        };

        this.game.startTransition('battle', battleData);
    }

    /**
     * Called by BattleScene to check for reinforcements
     */
    getReadyReinforcements(playerTileX, playerTileY) {
        const reinforcements = [];
        for (const enemy of this.enemies) {
            if (enemy.alive && enemy.atbReady && enemy.state !== 'in_battle') {
                const dir = enemy.getDirectionRelativeToPlayer(playerTileX, playerTileY);
                const formation = getRandomFormation(enemy.type);
                enemy.enterBattle();
                enemy.atbValue = 0;
                enemy.atbReady = false;
                reinforcements.push({
                    direction: dir,
                    formation,
                    sourceEnemies: [enemy],
                });
            }
        }
        return reinforcements;
    }

    render(ctx) {
        this.tileMap.render(ctx, this.camera);

        // Render enemies
        for (const enemy of this.enemies) {
            enemy.render(ctx, this.camera);
        }

        // Render player
        this.player.render(ctx, this.camera);

        // UI overlay
        this._renderMapUI(ctx);
    }

    _renderMapUI(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(5, 5, 200, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`位置: (${this.player.tileX}, ${this.player.tileY})`, 12, 22);

        // Controls hint
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(5, this.game.height - 30, 300, 24);
        ctx.fillStyle = '#aaa';
        ctx.font = '12px monospace';
        ctx.fillText('方向鍵移動 | 靠近敵人觸發戰鬥', 12, this.game.height - 12);
    }
}
