import { Game } from './core/Game.js';
import { MapScene } from './map/MapScene.js';
import { BattleScene } from './battle/BattleScene.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

// Make game globally accessible for debugging
window.game = game;

const mapScene = new MapScene(game);
const battleScene = new BattleScene(game);

game.registerScene('map', mapScene);
game.registerScene('battle', battleScene);

game.switchScene('map');
game.start();

console.log('Game started!');
