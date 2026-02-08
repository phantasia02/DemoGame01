export class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.lastTime = 0;
        this.running = false;
        this._frame = this._frame.bind(this);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._frame);
    }

    stop() {
        this.running = false;
    }

    _frame(timestamp) {
        if (!this.running) return;

        const dt = Math.min(timestamp - this.lastTime, 50); // cap at 50ms
        this.lastTime = timestamp;

        this.updateFn(dt);
        this.renderFn();

        requestAnimationFrame(this._frame);
    }
}
