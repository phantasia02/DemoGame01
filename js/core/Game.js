import { GameLoop } from './GameLoop.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './EventBus.js';

export const GameState = {
    LOADING: 'LOADING',
    MAP: 'MAP',
    BATTLE: 'BATTLE',
    TRANSITION: 'TRANSITION'
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new InputManager();
        this.eventBus = new EventBus();
        this.state = GameState.LOADING;
        this.currentScene = null;
        this.scenes = {};

        // Transition state
        this.transition = null;

        this.loop = new GameLoop(
            (dt) => this.update(dt),
            () => this.render()
        );
    }

    registerScene(name, scene) {
        this.scenes[name] = scene;
    }

    switchScene(name, data) {
        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }
        this.currentScene = this.scenes[name];
        this.state = name === 'map' ? GameState.MAP : GameState.BATTLE;
        if (this.currentScene && this.currentScene.enter) {
            this.currentScene.enter(data);
        }
    }

    startTransition(targetScene, data, duration = 500) {
        this.transition = {
            targetScene,
            data,
            duration,
            elapsed: 0,
            phase: 'out' // 'out' = fade to black, 'in' = fade from black
        };
        this.state = GameState.TRANSITION;
    }

    start() {
        this.loop.start();
    }

    update(dt) {
        if (this.transition) {
            this.transition.elapsed += dt;
            const halfDuration = this.transition.duration / 2;

            if (this.transition.phase === 'out' && this.transition.elapsed >= halfDuration) {
                this.transition.phase = 'in';
                this.transition.elapsed = 0;
                this.switchScene(this.transition.targetScene, this.transition.data);
            } else if (this.transition.phase === 'in' && this.transition.elapsed >= halfDuration) {
                this.transition = null;
            }
        }

        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(dt);
        }

        this.input.clear();
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(this.ctx);
        }

        // Draw transition overlay
        if (this.transition) {
            const halfDuration = this.transition.duration / 2;
            let alpha;
            if (this.transition.phase === 'out') {
                alpha = this.transition.elapsed / halfDuration;
            } else {
                alpha = 1 - (this.transition.elapsed / halfDuration);
            }
            alpha = Math.max(0, Math.min(1, alpha));
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}
