import { ATBSystem } from './ATBSystem.js';
import { SquadManager } from './SquadManager.js';
import { BattleAI } from './BattleAI.js';
import { ABILITIES } from '../data/AbilityDefinitions.js';
import { DEFAULT_PARTY } from '../data/UnitDefinitions.js';

export const BattleState = {
    STARTING: 'starting',
    RUNNING: 'running',
    PLAYER_MENU: 'player_menu',
    PLAYER_TARGET: 'player_target',
    EXECUTING: 'executing',
    REINFORCEMENT: 'reinforcement',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
};

export class BattleManager {
    constructor(game) {
        this.game = game;
        this.atbSystem = new ATBSystem();
        this.squadManager = new SquadManager();
        this.state = BattleState.STARTING;
        this.battleLog = [];
        this.activeUnit = null;
        this.selectedAbility = null;
        this.pendingActions = [];
        this.executingAction = null;
        this.executeTimer = 0;

        // For reinforcement checks
        this.mapScene = null;
        this.playerTileX = 0;
        this.playerTileY = 0;
        this.approachDetectRange = 12; // Manhattan distance to detect enemies
        this.approachingEnemies = []; // enemies currently moving toward battle

        // Battle result
        this.totalExp = 0;
        this.totalGold = 0;
        this.defeatedMapEnemies = [];

        // Damage numbers
        this.damageNumbers = [];

        // Start timer
        this.startTimer = 0;
    }

    init(battleData) {
        this.state = BattleState.STARTING;
        this.startTimer = 0;
        this.battleLog = [];
        this.damageNumbers = [];
        this.totalExp = 0;
        this.totalGold = 0;
        this.defeatedMapEnemies = [];

        this.squadManager = new SquadManager();
        this.atbSystem = new ATBSystem();

        // Setup player party
        this.squadManager.setupPlayerParty(DEFAULT_PARTY);

        // Setup initial enemy squads
        if (battleData.squads) {
            for (const squad of battleData.squads) {
                this.squadManager.addEnemySquad(squad.direction, squad.formation);
                if (squad.sourceEnemies) {
                    this.defeatedMapEnemies.push(...squad.sourceEnemies.map(e => e.id));
                }
            }
        }

        // Map reference for reinforcements
        this.mapScene = battleData.mapScene || null;
        this.playerTileX = battleData.playerTileX || 0;
        this.playerTileY = battleData.playerTileY || 0;
        this.approachingEnemies = [];

        // Start approaching for nearby enemies
        this._initApproachingEnemies();

        this.addLog('戰鬥開始！');
    }

    addLog(msg) {
        this.battleLog.push(msg);
        if (this.battleLog.length > 8) this.battleLog.shift();
    }

    addDamageNumber(x, y, value, color = '#fff') {
        this.damageNumbers.push({ x, y, value, color, timer: 0, duration: 800 });
    }

    update(dt) {
        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(d => {
            d.timer += dt;
            d.y -= dt * 0.05;
            return d.timer < d.duration;
        });

        // Update unit visuals
        for (const unit of this.squadManager.getAllUnits()) {
            unit.updateVisual(dt);
        }

        // Update squad animations
        this.squadManager.updateAnimations(dt);

        switch (this.state) {
            case BattleState.STARTING:
                this.startTimer += dt;
                if (this.startTimer >= 800) {
                    this.state = BattleState.RUNNING;
                }
                break;

            case BattleState.RUNNING:
                this._updateRunning(dt);
                break;

            case BattleState.PLAYER_MENU:
            case BattleState.PLAYER_TARGET:
                // ATB paused while player selects (Wait mode)
                break;

            case BattleState.EXECUTING:
                this._updateExecuting(dt);
                break;

            case BattleState.REINFORCEMENT:
                this.squadManager.updateAnimations(dt);
                // Check if entrance animation is done
                let anyEntering = false;
                for (const grid of Object.values(this.squadManager.grids)) {
                    if (grid.entering) anyEntering = true;
                }
                if (!anyEntering) {
                    this.state = BattleState.RUNNING;
                }
                break;

            case BattleState.VICTORY:
            case BattleState.DEFEAT:
                // Handled by BattleScene
                break;
        }
    }

    _updateRunning(dt) {
        // Update ATB
        this.atbSystem.update(dt, this.squadManager.getAllAliveUnits());

        // Check for ready units
        const allAlive = this.squadManager.getAllAliveUnits();

        for (const unit of allAlive) {
            if (!unit.atbReady) continue;

            if (unit.isPlayer) {
                // Player turn: open menu
                this.activeUnit = unit;
                this.state = BattleState.PLAYER_MENU;
                this.atbSystem.pause();
                return;
            } else {
                // Enemy turn: AI decides
                const action = BattleAI.chooseAction(
                    unit,
                    this.squadManager.getPlayerUnits(),
                    this.squadManager.getEnemyUnits()
                );
                if (action) {
                    this.pendingActions.push({ unit, ...action });
                    this.atbSystem.resetUnit(unit);
                }
            }
        }

        // Execute pending actions
        if (this.pendingActions.length > 0 && !this.executingAction) {
            this.executingAction = this.pendingActions.shift();
            this.executeTimer = 0;
            this.state = BattleState.EXECUTING;
        }

        // Check reinforcements
        this._checkReinforcements(dt);
    }

    _updateExecuting(dt) {
        this.executeTimer += dt;

        if (this.executeTimer >= 300 && this.executingAction) {
            this._executeAction(this.executingAction);
            this.executingAction = null;
        }

        if (this.executeTimer >= 600) {
            // Check win/lose
            if (!this.squadManager.hasAliveEnemies()) {
                this._victory();
                return;
            }
            if (!this.squadManager.hasAlivePlayers()) {
                this._defeat();
                return;
            }

            this.squadManager.removeDeadFromGrids();
            this.state = BattleState.RUNNING;
            this.atbSystem.resume();
        }
    }

    _executeAction(action) {
        const { unit, abilityId, ability, targets } = action;

        if (!unit.alive) return;

        unit.spendMp(ability.mpCost);

        if (ability.type === 'defend') {
            unit.defending = true;
            this.addLog(`${unit.name} 進入防禦姿態`);
            return;
        }

        if (ability.type === 'heal') {
            for (const target of targets) {
                if (!target.alive) continue;
                const healPower = ability.power + unit.magic;
                const variance = 0.9 + Math.random() * 0.2;
                const healAmount = Math.floor(healPower * variance);
                const actual = target.healHp(healAmount);
                this.addLog(`${unit.name} 對 ${target.name} 使用 ${ability.name}，回復 ${actual} HP`);
                this.addDamageNumber(target.screenX, target.screenY - 20, `+${actual}`, '#2ecc71');
            }
            return;
        }

        if (ability.type === 'special') {
            // Steal - just a flavor action
            const success = Math.random() < 0.4;
            if (success) {
                this.addLog(`${unit.name} 成功偷取了道具！`);
            } else {
                this.addLog(`${unit.name} 的偷竊失敗了`);
            }
            return;
        }

        // Physical or magical damage
        const hits = ability.hits || 1;
        for (let h = 0; h < hits; h++) {
            for (const target of targets) {
                if (!target.alive) continue;
                let damage;

                if (ability.type === 'physical') {
                    const atk = unit.attack * ability.power;
                    const def = target.defense;
                    // Row modifiers
                    let atkMod = 1.0;
                    let defMod = 1.0;
                    if (unit.gridRow === 0) atkMod = 1.2; // front row bonus
                    if (target.gridRow === 2) defMod = 0.8; // back row defense
                    damage = Math.floor((atk * 2 * atkMod - def) * defMod * (0.9 + Math.random() * 0.2));
                } else {
                    // Magical
                    const magPow = (unit.magic + ability.power) * 2;
                    const magDef = target.magicDef;
                    damage = Math.floor((magPow - magDef) * (0.9 + Math.random() * 0.2));
                }

                damage = Math.max(1, damage);
                const actual = target.takeDamage(damage);
                this.addLog(`${unit.name} 使用 ${ability.name} 對 ${target.name} 造成 ${actual} 點傷害`);
                this.addDamageNumber(target.screenX, target.screenY - 20, actual, ability.color || '#fff');

                if (!target.alive) {
                    this.addLog(`${target.name} 被擊敗了！`);
                    this.totalExp += target.exp;
                    this.totalGold += target.gold;
                }
            }
        }
    }

    _initApproachingEnemies() {
        if (!this.mapScene) return;
        for (const enemy of this.mapScene.enemies) {
            if (!enemy.alive || enemy.state === 'in_battle' || enemy.state === 'dead') continue;
            const dist = enemy.distanceTo(this.playerTileX, this.playerTileY);
            if (dist <= this.approachDetectRange && dist > 0) {
                enemy.startApproaching();
                this.approachingEnemies.push(enemy);
            }
        }
    }

    _checkReinforcements(dt) {
        if (!this.mapScene) return;

        // Move approaching enemies toward battle position
        const tileMap = this.mapScene.tileMap;

        for (const enemy of this.approachingEnemies) {
            if (!enemy.alive) continue;
            enemy.moveTowardBattle(dt, this.playerTileX, this.playerTileY, tileMap);
        }

        // Check for enemies that have arrived
        const reinforcements = this.mapScene.getReadyReinforcements(this.playerTileX, this.playerTileY);
        if (reinforcements.length === 0) return;

        // Remove arrived enemies from approaching list
        this.approachingEnemies = this.approachingEnemies.filter(
            e => e.state === 'approaching_battle' && !e.readyToJoinBattle
        );

        for (const r of reinforcements) {
            const units = this.squadManager.addEnemySquad(r.direction, r.formation);
            if (units.length > 0) {
                this.addLog(`敵人增援從${this._dirName(r.direction)}出現！`);
                if (r.sourceEnemies) {
                    this.defeatedMapEnemies.push(...r.sourceEnemies.map(e => e.id));
                }
            }
        }

        this.state = BattleState.REINFORCEMENT;
    }

    _dirName(dir) {
        const names = { front: '前方', back: '後方', left: '左方', right: '右方' };
        return names[dir] || dir;
    }

    _victory() {
        this.state = BattleState.VICTORY;
        this.addLog('戰鬥勝利！');
        this.addLog(`獲得 ${this.totalExp} 經驗值，${this.totalGold} 金幣`);
    }

    _defeat() {
        this.state = BattleState.DEFEAT;
        this.addLog('全軍覆沒...');
    }

    // Player actions
    playerSelectAbility(abilityId) {
        this.selectedAbility = ABILITIES[abilityId];
        this.selectedAbilityId = abilityId;

        if (!this.selectedAbility) return;

        if (this.selectedAbility.target === 'self') {
            this.playerExecute([this.activeUnit]);
            return;
        }

        if (this.selectedAbility.target === 'all_allies') {
            this.playerExecute(this.squadManager.getPlayerUnits());
            return;
        }

        if (this.selectedAbility.target === 'all_enemies') {
            this.playerExecute(this.squadManager.getEnemyUnits());
            return;
        }

        // Need target selection
        this.state = BattleState.PLAYER_TARGET;
    }

    playerExecute(targets) {
        const action = {
            unit: this.activeUnit,
            abilityId: this.selectedAbilityId,
            ability: this.selectedAbility,
            targets
        };
        this.atbSystem.resetUnit(this.activeUnit);
        this.pendingActions.push(action);
        this.executingAction = this.pendingActions.shift();
        this.executeTimer = 0;
        this.state = BattleState.EXECUTING;
        this.activeUnit = null;
        this.selectedAbility = null;
    }

    cancelTargeting() {
        this.state = BattleState.PLAYER_MENU;
        this.selectedAbility = null;
    }

    cancelMenu() {
        // Can't really cancel - unit is ready
        // But let ATB continue
        this.activeUnit.atbReady = false;
        this.activeUnit.atb = this.activeUnit.atbMax * 0.8; // partial refund
        this.activeUnit = null;
        this.state = BattleState.RUNNING;
        this.atbSystem.resume();
    }
}
