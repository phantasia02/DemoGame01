import { ABILITIES } from '../data/AbilityDefinitions.js';

export class BattleAI {
    /**
     * Choose an action for the given enemy unit
     * Returns { ability, targets }
     */
    static chooseAction(unit, playerUnits, enemyUnits) {
        const aliveTargets = playerUnits.filter(u => u.alive);
        if (aliveTargets.length === 0) return null;

        // Pick a random usable ability
        const usable = unit.abilities.filter(aid => {
            const ab = ABILITIES[aid];
            if (!ab) return false;
            if (ab.mpCost > unit.mp) return false;
            return true;
        });

        const abilityId = usable.length > 0
            ? usable[Math.floor(Math.random() * usable.length)]
            : 'attack';

        const ability = ABILITIES[abilityId];
        let targets;

        switch (ability.target) {
            case 'single_enemy':
                // For enemies, "single_enemy" targets players
                targets = [aliveTargets[Math.floor(Math.random() * aliveTargets.length)]];
                break;
            case 'all_enemies':
                targets = [...aliveTargets];
                break;
            case 'single_ally':
                // Heal weakest ally
                const weakest = enemyUnits
                    .filter(u => u.alive)
                    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
                targets = weakest.length > 0 ? [weakest[0]] : [unit];
                break;
            case 'all_allies':
                targets = enemyUnits.filter(u => u.alive);
                break;
            case 'self':
                targets = [unit];
                break;
            default:
                targets = [aliveTargets[Math.floor(Math.random() * aliveTargets.length)]];
        }

        return { abilityId, ability, targets };
    }
}
