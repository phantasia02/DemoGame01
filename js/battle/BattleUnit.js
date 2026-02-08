export class BattleUnit {
    constructor(def, side, squadDir) {
        this.id = def.id || `${side}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        this.name = def.name;
        this.side = side; // 'player' or 'enemy'
        this.squadDirection = squadDir; // 'center','front','back','left','right'

        // Stats
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.maxMp = def.mp;
        this.mp = def.mp;
        this.attack = def.attack;
        this.defense = def.defense;
        this.magic = def.magic;
        this.magicDef = def.magicDef;
        this.speed = def.speed;

        // Grid position
        this.gridRow = def.gridPos ? def.gridPos.row : (def.row !== undefined ? def.row : 1);
        this.gridCol = def.gridPos ? def.gridPos.col : (def.col !== undefined ? def.col : 1);

        // ATB
        this.atb = 0;
        this.atbMax = 100;
        this.atbReady = false;

        // State
        this.alive = true;
        this.defending = false;
        this.abilities = def.abilities || ['attack'];
        this.color = def.color || '#fff';
        this.job = def.job || null;
        this.type = def.type || null; // enemy type for reference

        // Visual
        this.screenX = 0;
        this.screenY = 0;
        this.flashTimer = 0;
        this.shakeX = 0;
        this.actionAnim = null; // { type, timer, duration }

        // Enemy rewards
        this.exp = def.exp || 0;
        this.gold = def.gold || 0;
    }

    get isPlayer() { return this.side === 'player'; }

    get rowModifier() {
        // Front row (row 0): +20% physical damage dealt
        // Back row (row 2): -20% physical damage received
        return this.gridRow;
    }

    takeDamage(amount) {
        if (this.defending) {
            amount = Math.floor(amount / 2);
        }
        this.hp = Math.max(0, this.hp - amount);
        this.flashTimer = 200;
        this.shakeX = 8;
        if (this.hp <= 0) {
            this.alive = false;
            this.atb = 0;
            this.atbReady = false;
        }
        return amount;
    }

    healHp(amount) {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - before;
    }

    spendMp(cost) {
        this.mp = Math.max(0, this.mp - cost);
    }

    updateVisual(dt) {
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }
        if (this.shakeX > 0) {
            this.shakeX *= 0.85;
            if (this.shakeX < 0.5) this.shakeX = 0;
        }
        if (this.actionAnim) {
            this.actionAnim.timer += dt;
            if (this.actionAnim.timer >= this.actionAnim.duration) {
                this.actionAnim = null;
            }
        }
    }
}
