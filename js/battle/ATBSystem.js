export class ATBSystem {
    constructor() {
        this.paused = false;
        this.globalMultiplier = 1.0;
    }

    update(dt, allUnits) {
        if (this.paused) return;

        for (const unit of allUnits) {
            if (!unit.alive || unit.atbReady) continue;

            const fillRate = (unit.speed / 255) * this.globalMultiplier * (dt / 16.67);
            unit.atb = Math.min(unit.atbMax, unit.atb + fillRate);

            if (unit.atb >= unit.atbMax) {
                unit.atbReady = true;
            }
        }
    }

    resetUnit(unit) {
        unit.atb = 0;
        unit.atbReady = false;
        unit.defending = false;
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }
}
