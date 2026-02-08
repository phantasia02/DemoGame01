import { ABILITIES } from '../data/AbilityDefinitions.js';
import { PANEL_Y } from './BattleHUD.js';

/**
 * BattleMenu renders the command menu when a player unit is active
 * Shows as an overlay on the right side of the HUD
 */
export class BattleMenu {
    constructor() {
        this.visible = false;
        this.items = [];
        this.selectedIndex = 0;
        this.subMenu = null; // for magic sub-menu
        this.subSelectedIndex = 0;
    }

    open(unit) {
        this.visible = true;
        this.selectedIndex = 0;
        this.subMenu = null;

        // Build menu items from unit abilities
        this.items = [];

        // Always have Attack first
        if (unit.abilities.includes('attack')) {
            this.items.push({ id: 'attack', label: '攻擊' });
        }

        // Magic abilities
        const magicAbilities = unit.abilities.filter(a => {
            const ab = ABILITIES[a];
            return ab && (ab.type === 'magical' || ab.type === 'heal') && a !== 'attack';
        });
        if (magicAbilities.length > 0) {
            this.items.push({
                id: '_magic',
                label: '魔法',
                subItems: magicAbilities.map(a => ({
                    id: a,
                    label: `${ABILITIES[a].name} (${ABILITIES[a].mpCost}MP)`,
                    mpCost: ABILITIES[a].mpCost,
                }))
            });
        }

        // Special abilities
        const specials = unit.abilities.filter(a => {
            const ab = ABILITIES[a];
            return ab && ab.type === 'physical' && a !== 'attack';
        });
        if (specials.length > 0) {
            this.items.push({
                id: '_special',
                label: '特技',
                subItems: specials.map(a => ({
                    id: a,
                    label: `${ABILITIES[a].name} (${ABILITIES[a].mpCost}MP)`,
                    mpCost: ABILITIES[a].mpCost,
                }))
            });
        }

        // Steal
        if (unit.abilities.includes('steal')) {
            this.items.push({ id: 'steal', label: '偷竊' });
        }

        // Defend
        if (unit.abilities.includes('defend')) {
            this.items.push({ id: 'defend', label: '防禦' });
        }
    }

    close() {
        this.visible = false;
        this.subMenu = null;
    }

    handleInput(input) {
        if (!this.visible) return null;

        if (this.subMenu) {
            return this._handleSubInput(input);
        }

        if (input.isJustPressed('ArrowUp')) {
            this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
        }
        if (input.isJustPressed('ArrowDown')) {
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        }

        if (input.confirm) {
            const item = this.items[this.selectedIndex];
            if (item.subItems) {
                this.subMenu = item.subItems;
                this.subSelectedIndex = 0;
                return null;
            }
            this.close();
            return item.id;
        }

        if (input.cancel) {
            this.close();
            return '_cancel';
        }

        return null;
    }

    _handleSubInput(input) {
        if (input.isJustPressed('ArrowUp')) {
            this.subSelectedIndex = (this.subSelectedIndex - 1 + this.subMenu.length) % this.subMenu.length;
        }
        if (input.isJustPressed('ArrowDown')) {
            this.subSelectedIndex = (this.subSelectedIndex + 1) % this.subMenu.length;
        }

        if (input.confirm) {
            const item = this.subMenu[this.subSelectedIndex];
            this.close();
            return item.id;
        }

        if (input.cancel) {
            this.subMenu = null;
            this.subSelectedIndex = 0;
            return null;
        }

        return null;
    }

    render(ctx) {
        if (!this.visible) return;

        const menuX = 540;
        const menuY = PANEL_Y + 8;
        const menuWidth = 180;
        const itemHeight = 28;

        // Main menu
        const menuHeight = this.items.length * itemHeight + 12;
        ctx.fillStyle = 'rgba(10, 10, 40, 0.95)';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        ctx.strokeStyle = '#668';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        ctx.font = '14px monospace';
        for (let i = 0; i < this.items.length; i++) {
            const iy = menuY + 8 + i * itemHeight;

            if (i === this.selectedIndex && !this.subMenu) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
                ctx.fillRect(menuX + 4, iy - 2, menuWidth - 8, itemHeight - 2);
                ctx.fillStyle = '#fff';
                ctx.fillText('▶', menuX + 10, iy + 16);
            }

            ctx.fillStyle = i === this.selectedIndex && !this.subMenu ? '#fff' : '#999';
            ctx.textAlign = 'left';
            ctx.fillText(this.items[i].label, menuX + 28, iy + 16);
        }

        // Sub menu
        if (this.subMenu) {
            const subX = menuX + menuWidth + 4;
            const subHeight = this.subMenu.length * itemHeight + 12;
            ctx.fillStyle = 'rgba(10, 10, 40, 0.95)';
            ctx.fillRect(subX, menuY, menuWidth + 30, subHeight);
            ctx.strokeStyle = '#668';
            ctx.lineWidth = 2;
            ctx.strokeRect(subX, menuY, menuWidth + 30, subHeight);

            for (let i = 0; i < this.subMenu.length; i++) {
                const iy = menuY + 8 + i * itemHeight;

                if (i === this.subSelectedIndex) {
                    ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
                    ctx.fillRect(subX + 4, iy - 2, menuWidth + 22, itemHeight - 2);
                    ctx.fillStyle = '#fff';
                    ctx.fillText('▶', subX + 10, iy + 16);
                }

                ctx.fillStyle = i === this.subSelectedIndex ? '#fff' : '#999';
                ctx.textAlign = 'left';
                ctx.fillText(this.subMenu[i].label, subX + 28, iy + 16);
            }
        }
    }
}
