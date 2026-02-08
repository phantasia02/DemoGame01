import { BattleManager, BattleState } from './BattleManager.js';
import { BattleRenderer } from './BattleRenderer.js';
import { BattleHUD } from '../ui/BattleHUD.js';
import { BattleMenu } from '../ui/BattleMenu.js';
import { TargetSelector } from '../ui/TargetSelector.js';
import { ABILITIES } from '../data/AbilityDefinitions.js';

export class BattleScene {
    constructor(game) {
        this.game = game;
        this.manager = new BattleManager(game);
        this.renderer = new BattleRenderer(game.width, game.height);
        this.hud = new BattleHUD(game.width);
        this.menu = new BattleMenu();
        this.targetSelector = new TargetSelector();

        // Victory/defeat screen
        this.endTimer = 0;
        this.endDuration = 3000;
    }

    enter(data) {
        this.manager = new BattleManager(this.game);
        this.manager.init(data);
        this.menu.close();
        this.targetSelector.close();
        this.endTimer = 0;
    }

    exit() {
        this.menu.close();
        this.targetSelector.close();
    }

    update(dt) {
        if (this.game.transition) return;

        this.manager.update(dt);
        this.targetSelector.update(dt);

        // Handle state-specific input
        switch (this.manager.state) {
            case BattleState.PLAYER_MENU:
                this._handleMenuState(dt);
                break;

            case BattleState.PLAYER_TARGET:
                this._handleTargetState(dt);
                break;

            case BattleState.VICTORY:
                this._handleEndState(dt);
                break;

            case BattleState.DEFEAT:
                this._handleEndState(dt);
                break;
        }
    }

    _handleMenuState(dt) {
        if (!this.menu.visible && this.manager.activeUnit) {
            this.menu.open(this.manager.activeUnit);
        }

        const result = this.menu.handleInput(this.game.input);
        if (result === '_cancel') {
            this.manager.cancelMenu();
            return;
        }
        if (result) {
            this.manager.playerSelectAbility(result);
            // If it needs target selection, open target selector
            if (this.manager.state === BattleState.PLAYER_TARGET) {
                const ability = ABILITIES[result];
                let targets;
                if (ability.target === 'single_enemy') {
                    targets = this.manager.squadManager.getEnemyUnits();
                } else if (ability.target === 'single_ally') {
                    targets = this.manager.squadManager.getPlayerUnits();
                } else {
                    targets = this.manager.squadManager.getEnemyUnits();
                }
                this.targetSelector.open(targets);
            }
        }
    }

    _handleTargetState(dt) {
        const result = this.targetSelector.handleInput(this.game.input);
        if (result === '_cancel') {
            this.manager.cancelTargeting();
            this.menu.open(this.manager.activeUnit);
            return;
        }
        if (result) {
            this.manager.playerExecute([result]);
        }
    }

    _handleEndState(dt) {
        this.endTimer += dt;
        if (this.endTimer >= this.endDuration) {
            if (this.game.input.confirm || this.endTimer >= this.endDuration + 2000) {
                this._returnToMap();
            }
        }
    }

    _returnToMap() {
        const data = {
            defeatedEnemies: this.manager.defeatedMapEnemies,
        };
        this.game.startTransition('map', data);
    }

    render(ctx) {
        // Battle scene
        this.renderer.render(ctx, this.manager.squadManager, this.manager);

        // HUD
        this.hud.render(ctx, this.manager.squadManager, this.manager);

        // Menu
        this.menu.render(ctx);

        // Target selector
        this.targetSelector.render(ctx);

        // State overlays
        if (this.manager.state === BattleState.STARTING) {
            this._renderStartOverlay(ctx);
        }
        if (this.manager.state === BattleState.VICTORY) {
            this._renderVictoryOverlay(ctx);
        }
        if (this.manager.state === BattleState.DEFEAT) {
            this._renderDefeatOverlay(ctx);
        }
        if (this.manager.state === BattleState.REINFORCEMENT) {
            this._renderReinforcementOverlay(ctx);
        }
    }

    _renderStartOverlay(ctx) {
        const alpha = Math.max(0, 1 - this.manager.startTimer / 800);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        ctx.fillStyle = `rgba(255, 255, 255, ${1 - alpha})`;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('戰鬥開始！', this.game.width / 2, 240);
    }

    _renderVictoryOverlay(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 50, 0.6)';
        ctx.fillRect(0, 0, this.game.width, 460);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('勝 利 ！', this.game.width / 2, 180);

        ctx.fillStyle = '#fff';
        ctx.font = '18px monospace';
        ctx.fillText(`經驗值 +${this.manager.totalExp}`, this.game.width / 2, 230);
        ctx.fillText(`金幣 +${this.manager.totalGold}`, this.game.width / 2, 260);

        if (this.endTimer >= this.endDuration) {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px monospace';
            ctx.fillText('按 Z 鍵返回地圖', this.game.width / 2, 320);
        }
    }

    _renderDefeatOverlay(ctx) {
        ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.width, 460);

        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('全 軍 覆 沒', this.game.width / 2, 200);

        if (this.endTimer >= this.endDuration) {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px monospace';
            ctx.fillText('按 Z 鍵返回地圖', this.game.width / 2, 280);
        }
    }

    _renderReinforcementOverlay(ctx) {
        ctx.fillStyle = 'rgba(200, 50, 50, 0.3)';
        ctx.fillRect(0, 0, this.game.width, 460);

        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ 敵方增援到來！', this.game.width / 2, 30);
    }
}
