export class Camera {
    constructor(viewWidth, viewHeight) {
        this.x = 0;
        this.y = 0;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.worldWidth = 0;
        this.worldHeight = 0;
        this.smoothing = 0.1;
    }

    setWorldBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }

    follow(targetX, targetY, dt) {
        const desiredX = targetX - this.viewWidth / 2;
        const desiredY = targetY - this.viewHeight / 2;

        // Smooth interpolation
        const factor = 1 - Math.pow(1 - this.smoothing, dt / 16.67);
        this.x += (desiredX - this.x) * factor;
        this.y += (desiredY - this.y) * factor;

        // Clamp to world bounds
        this.x = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.x));
        this.y = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.y));
    }

    snapTo(targetX, targetY) {
        this.x = targetX - this.viewWidth / 2;
        this.y = targetY - this.viewHeight / 2;
        this.x = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.x));
        this.y = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.y));
    }
}
