import GameScene from "./classes/scenes/GameScene.js";
import MenuScene from "./classes/scenes/MenuScene.js";
import ZeusPrescript from "./classes/scenes/ZeusPrescript.js";
import WinPrescript from "./classes/scenes/WinPrescript.js";
import LosePrescript from "./classes/scenes/LosePrescript.js";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: 0x222323,
  physics: {
    default: "arcade",
    arcade: {
      // debug: true
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  loader: {
    baseURL: "../assets",
  },
  scene: [MenuScene, ZeusPrescript, GameScene, WinPrescript, LosePrescript],
});
