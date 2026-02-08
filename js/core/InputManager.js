export class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.justReleased = {};

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    _onKeyDown(e) {
        if (!this.keys[e.code]) {
            this.justPressed[e.code] = true;
        }
        this.keys[e.code] = true;
        e.preventDefault();
    }

    _onKeyUp(e) {
        this.keys[e.code] = false;
        this.justReleased[e.code] = true;
        e.preventDefault();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isJustPressed(code) {
        return !!this.justPressed[code];
    }

    isJustReleased(code) {
        return !!this.justReleased[code];
    }

    clear() {
        this.justPressed = {};
        this.justReleased = {};
    }

    // Direction helpers
    get up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
    get down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
    get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
    get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
    get confirm() { return this.isJustPressed('KeyZ') || this.isJustPressed('Enter'); }
    get cancel() { return this.isJustPressed('KeyX') || this.isJustPressed('Escape'); }
}
