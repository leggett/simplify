export default class UIScene extends Phaser.Scene {
  sec = 0;

  constructor() {
    super("ui");
  }

  create() {
    this.timer = this.add.text(16, 16, "⏱ 300").setFontSize(20);
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      repeat: 300,
    });
  }
  updateTimer = () => {
    this.sec++;
    if (this.sec === 300) {
      this.scene.start("lose");
      this.scene.stop("game");
    }
    this.timer.setText(`⏱ ${300 - this.sec}`);
  };
}
