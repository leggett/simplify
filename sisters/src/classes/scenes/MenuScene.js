export default class MenuScene extends Phaser.Scene {
  pointerFound = false;

  constructor() {
    super("menu");
  }

  preload() {
    this.load.image("title", "sprites/title.png");
    this.load.image("background", "sprites/title-bg.png");
    this.load.image("start-btn", "sprites/start.png");
  }

  create() {
    this.lights.enable().setAmbientColor(0x555555);

    this.add.image(400, 20, "title").setOrigin(0.5, 0).setScale(3);

    this.add.image(400, 250, "start-btn").setOrigin(0.5, 0).setScale(3);

    this.add
      .image(0, 0, "background")
      .setOrigin(0)
      .setScale(5)
      .setPipeline("Light2D")
      .setDepth(-1);

    this.pointerLight = this.lights.addLight(400, 20, 200, 0xffffff, 2);

    this.input.keyboard.on("keydown", () => {
      this.scene.start("zeus");
    });
  }

  update() {
    this.pointerLight.setPosition(
      this.pointerFound ? this.input.x : 400,
      this.pointerFound ? this.input.y : 20
    );
    if (this.input.x !== 0) this.pointerFound = true;
  }
}
