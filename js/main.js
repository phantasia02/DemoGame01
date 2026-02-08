import { Game } from './core/Game.js';
import { MapScene } from './map/MapScene.js';
import { BattleScene } from './battle/BattleScene.js';
import { GameConfig } from './data/GameConfig.js';

const canvas = document.getElementById('game-canvas');

async function initGame() {
    await GameConfig.load();

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

let game = null;
initGame().then(g => { game = g; });

// R key to reset game
window.addEventListener('keydown', async (e) => {
    if (e.code === 'KeyR') {
        if (game) game.loop.stop();
        game = await initGame();
        console.log('Game reset!');
    }
});

// 將設定暴露到 window，方便在控制台調整
window.GameConfig = GameConfig;

console.log('Game starting... Press R to reset.');
console.log('修改 config.json 中的 enemyDensity (0.5~2.0)，然後按 R 重置生效');
