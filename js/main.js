import { Game } from './core/Game.js';
import { MapScene } from './map/MapScene.js';
import { BattleScene } from './battle/BattleScene.js';

const canvas = document.getElementById('game-canvas');

function initGame() {
    const game = new Game(canvas);
    window.game = game;

    const mapScene = new MapScene(game);
    const battleScene = new BattleScene(game);

    game.registerScene('map', mapScene);
    game.registerScene('battle', battleScene);

    game.switchScene('map');
    game.start();

    return game;
}

let game = initGame();

// R key to reset game
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
        game.loop.stop();
        game = initGame();
        console.log('Game reset!');
    }
});

console.log('Game started! Press R to reset.');
