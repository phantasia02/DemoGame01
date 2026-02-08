import { TILE_SIZE } from '../data/MapData.js';
import { ENEMY_UNITS } from '../data/UnitDefinitions.js';

const EnemyState = {
    PATROL: 'patrol',
    CHASE: 'chase',
    RETURNING: 'returning',
    IN_BATTLE: 'in_battle',
    APPROACHING_BATTLE: 'approaching_battle',
    DEAD: 'dead',
};

export class MapEnemy {
    constructor(spawnData, id) {
        this.id = id;
        this.type = spawnData.type;
        this.tileX = spawnData.x;
        this.tileY = spawnData.y;
        this.pixelX = spawnData.x * TILE_SIZE + TILE_SIZE / 2;
        this.pixelY = spawnData.y * TILE_SIZE + TILE_SIZE / 2;
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;

        this.patrol = spawnData.patrol || [];
        this.patrolIndex = 0;
        this.state = EnemyState.PATROL;
        this.moveSpeed = 2; // tiles per second
        this.moving = false;
        this.size = TILE_SIZE - 6;

        // Detection
        this.detectRange = 5; // tiles
        this.chaseRange = 7; // tiles

        // ATB for joining battles (kept for backward compat, but no longer primary)
        this.atbValue = 0;
        this.atbMax = 100;
        this.atbReady = false;
        const def = ENEMY_UNITS[this.type];
        this.atbSpeed = def ? def.speed : 80;

        // Approaching battle state
        this.approachTimer = 0;
        this.approachInterval = 500; // ms per tile movement
        this.readyToJoinBattle = false;

        // Patrol wait timer
        this.waitTimer = 0;
        this.waitDuration = 1000; // ms to wait at patrol points

        // Animation
        this.animTimer = 0;
        this.animFrame = 0;

        // Alive state
        this.alive = true;
    }

    update(dt, playerTileX, playerTileY, tileMap, battleActive) {
        if (!this.alive || this.state === EnemyState.DEAD) return;

        this.animTimer += dt;
        if (this.animTimer > 300) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        if (this.state === EnemyState.IN_BATTLE) {
            return;
        }

        // If approaching battle, handle movement toward battle position
        if (this.state === EnemyState.APPROACHING_BATTLE) {
            this._interpolateMove(dt);
            return;
        }

        const distToPlayer = this._tileDistance(playerTileX, playerTileY);

        switch (this.state) {
            case EnemyState.PATROL:
                if (!battleActive && distToPlayer <= this.detectRange) {
                    this.state = EnemyState.CHASE;
                    break;
                }
                this._doPatrol(dt, tileMap);
                break;

            case EnemyState.CHASE:
                if (battleActive) {
                    this.state = EnemyState.PATROL;
                    break;
                }
                if (distToPlayer > this.chaseRange) {
                    this.state = EnemyState.RETURNING;
                    break;
                }
                this._doChase(dt, playerTileX, playerTileY, tileMap);
                break;

            case EnemyState.RETURNING:
                if (!battleActive && distToPlayer <= this.detectRange) {
                    this.state = EnemyState.CHASE;
                    break;
                }
                this._doReturn(dt, tileMap);
                break;
        }
    }

    /**
     * Start approaching the player's battle position
     */
    startApproaching() {
        if (this.state === EnemyState.IN_BATTLE ||
            this.state === EnemyState.DEAD ||
            this.state === EnemyState.APPROACHING_BATTLE) return;
        this.state = EnemyState.APPROACHING_BATTLE;
        this.approachTimer = 0;
        this.readyToJoinBattle = false;
    }

    /**
     * Move one tile toward the battle position (called by BattleManager)
     * Returns true if enemy has arrived at the target
     */
    moveTowardBattle(dt, targetTileX, targetTileY, tileMap) {
        if (this.state !== EnemyState.APPROACHING_BATTLE) return false;

        // If already at target, mark as ready
        if (this.tileX === targetTileX && this.tileY === targetTileY) {
            this.readyToJoinBattle = true;
            return true;
        }

        // Accumulate timer for step-by-step movement
        this.approachTimer += dt;
        if (this.approachTimer < this.approachInterval) return false;
        this.approachTimer -= this.approachInterval;

        // Move one tile toward target
        this._moveTowardTile(targetTileX, targetTileY, tileMap);

        // Check arrival after move
        if (this.tileX === targetTileX && this.tileY === targetTileY) {
            this.readyToJoinBattle = true;
            return true;
        }

        return false;
    }

    /**
     * Get Manhattan distance to a tile
     */
    distanceTo(tx, ty) {
        return this._tileDistance(tx, ty);
    }

    _doPatrol(dt, tileMap) {
        if (this.patrol.length === 0) return;

        if (this.waitTimer > 0) {
            this.waitTimer -= dt;
            return;
        }

        if (!this.moving) {
            const target = this.patrol[this.patrolIndex];
            if (this.tileX === target.x && this.tileY === target.y) {
                this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
                this.waitTimer = this.waitDuration;
                return;
            }
            this._moveTowardTile(target.x, target.y, tileMap);
        }

        this._interpolateMove(dt);
    }

    _doChase(dt, playerTileX, playerTileY, tileMap) {
        if (!this.moving) {
            this._moveTowardTile(playerTileX, playerTileY, tileMap);
        }
        this._interpolateMove(dt);
    }

    _doReturn(dt, tileMap) {
        if (this.patrol.length === 0) {
            this.state = EnemyState.PATROL;
            return;
        }
        const home = this.patrol[0];
        if (this.tileX === home.x && this.tileY === home.y) {
            this.state = EnemyState.PATROL;
            this.patrolIndex = 0;
            return;
        }
        if (!this.moving) {
            this._moveTowardTile(home.x, home.y, tileMap);
        }
        this._interpolateMove(dt);
    }

    _moveTowardTile(tx, ty, tileMap) {
        const dx = tx - this.tileX;
        const dy = ty - this.tileY;

        // Prefer axis with larger distance
        let newX = this.tileX;
        let newY = this.tileY;

        if (Math.abs(dx) >= Math.abs(dy)) {
            newX += Math.sign(dx);
            if (!tileMap.isWalkable(newX, newY)) {
                newX = this.tileX;
                newY += Math.sign(dy);
            }
        } else {
            newY += Math.sign(dy);
            if (!tileMap.isWalkable(newX, newY)) {
                newY = this.tileY;
                newX += Math.sign(dx);
            }
        }

        if (tileMap.isWalkable(newX, newY) && (newX !== this.tileX || newY !== this.tileY)) {
            this.tileX = newX;
            this.tileY = newY;
            this.targetPixelX = newX * TILE_SIZE + TILE_SIZE / 2;
            this.targetPixelY = newY * TILE_SIZE + TILE_SIZE / 2;
            this.moving = true;
        }
    }

    _interpolateMove(dt) {
        if (!this.moving) return;

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
    }

    _tileDistance(tx, ty) {
        return Math.abs(this.tileX - tx) + Math.abs(this.tileY - ty);
    }

    checkCollision(playerTileX, playerTileY) {
        return this.alive &&
            this.state !== EnemyState.IN_BATTLE &&
            this.state !== EnemyState.APPROACHING_BATTLE &&
            this.state !== EnemyState.DEAD &&
            this.tileX === playerTileX &&
            this.tileY === playerTileY;
    }

    enterBattle() {
        this.state = EnemyState.IN_BATTLE;
    }

    die() {
        this.alive = false;
        this.state = EnemyState.DEAD;
    }

    /**
     * Get direction relative to player for battle join
     * Returns 'front', 'back', 'left', 'right'
     */
    getDirectionRelativeToPlayer(playerTileX, playerTileY) {
        const dx = this.tileX - playerTileX;
        const dy = this.tileY - playerTileY;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'front' : 'back';
        }
    }

    render(ctx, camera) {
        if (!this.alive || this.state === EnemyState.IN_BATTLE) return;

        const x = this.pixelX - camera.x;
        const y = this.pixelY - camera.y;
        const halfSize = this.size / 2;
        const def = ENEMY_UNITS[this.type];
        const color = def ? def.color : '#f00';
        const darkColor = def ? def.darkColor : '#a00';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + halfSize + 2, halfSize * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = color;
        const bobY = this.animFrame === 1 ? -2 : 0;

        if (this.type === 'slime') {
            // Slime: rounded blob
            ctx.beginPath();
            ctx.ellipse(x, y + bobY, halfSize, halfSize * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = darkColor;
            ctx.beginPath();
            ctx.ellipse(x, y + bobY + 3, halfSize * 0.9, halfSize * 0.5, 0, 0, Math.PI);
            ctx.fill();
        } else {
            // Others: square-ish body
            ctx.fillRect(x - halfSize, y - halfSize + bobY, this.size, this.size);
            ctx.fillStyle = darkColor;
            ctx.fillRect(x - halfSize + 2, y + bobY, this.size - 4, halfSize);
        }

        // Eyes - approaching enemies have orange eyes
        if (this.state === EnemyState.APPROACHING_BATTLE) {
            ctx.fillStyle = '#f90';
        } else if (this.state === EnemyState.CHASE) {
            ctx.fillStyle = '#ff0';
        } else {
            ctx.fillStyle = '#fff';
        }
        ctx.fillRect(x - 5, y - 4 + bobY, 3, 3);
        ctx.fillRect(x + 3, y - 4 + bobY, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 4, y - 3 + bobY, 2, 2);
        ctx.fillRect(x + 4, y - 3 + bobY, 2, 2);

        // Chase indicator
        if (this.state === EnemyState.CHASE) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', x, y - halfSize - 4 + bobY);
        }

        // Approaching indicator
        if (this.state === EnemyState.APPROACHING_BATTLE) {
            ctx.fillStyle = '#f90';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!!', x, y - halfSize - 4 + bobY);
        }
    }
}
