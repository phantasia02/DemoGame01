import { Game } from './core/Game.js';
import { MapScene } from './map/MapScene.js';
import { BattleScene } from './battle/BattleScene.js';
import { GameConfig } from './data/GameConfig.js';

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

// 將設定暴露到 window，方便在控制台調整
window.GameConfig = GameConfig;

console.log('Game started! Press R to reset.');
console.log('調整敵人密度: GameConfig.enemyDensity = 0.5~2.0，然後按 R 重置生效');
