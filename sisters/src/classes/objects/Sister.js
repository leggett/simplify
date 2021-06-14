export default class Sister extends Phaser.GameObjects.Container {
  static SPEED = 40;
  static PATIENTICE = 1500;
  static CALMING_SPEED = 5;

  static eye = 0;
  static count = 0;
  /**
   * @type {Sister[]}
   *
   * @static
   * @memberof Sister
   */
  static instances = [];
  static eyed = null;

  /**
   * @type {Object<string, Phaser.Input.Keyboard.Key>}
   *
   * @memberof Sister
   */
  keys;
  switchEyeNxt = false;
  anger = 0;
  hoarseness = 0;
  wanderDirection = 0;
  patientice = Sister.PATIENTICE;
  kicking = 0;
  speedBoost = 3;
  lps = false;

  /**
   * @type {Phaser.Physics.Arcade.Body}
   *
   * @memberof Sister
   */
  body = null;

  obj = {
    /** @type {Phaser.GameObjects.Sprite} */
    sprite: null,
    /** @type {Phaser.GameObjects.Rectangle} */
    patienticeBar: null,
    /** @type {Phaser.GameObjects.Light} */
    light: null,
    /** @type {Phaser.GameObjects.Sprite} */
    bubble: null,
    /** @type {Phaser.GameObjects.Particles.ParticleEmitter} */
    step: null,
  };

  /**
   * Creates an instance of Sister.
   * @param {object} config
   * @param {import("../scenes/GameScene.js").default} config.scene
   * @memberof Sister
   */
  constructor(config) {
    const light = config.scene.lights.addLight(0, 0, 72, 0xffffff, 1.1);
    const sprite = config.scene.add
      .sprite(0, -2, "sister")
      .setPipeline("Light2D");
    const bar = config.scene.add
      .rectangle(0, -8, 8, 1, [0x3245bf, 0xab492e, 0x2a6339][Sister.count])
      .setOrigin(0.5);
    const patientice = config.scene.add
      .rectangle(-4, -8, 8, 1, [0x6476e8, 0xfc6e47, 0x38ba5b][Sister.count])
      .setOrigin(0, 0.5);
    const bubble = config.scene.add.sprite(0, -13, "bubble").setVisible(false);
    const step = config.scene.add.particles("step");

    super(config.scene, config.x, config.y, [sprite, bar, patientice, bubble]);

    this.setSize(4, 4);

    config.scene.add.existing(this);
    config.scene.physics.world.enableBody(this);
    config.scene.updates.push(this);
    Sister.instances.push(this);

    config.scene.physics.add.collider(this, config.scene.level);

    this.obj.sprite = sprite;
    this.obj.patienticeBar = patientice;
    this.obj.light = light;
    this.obj.bubble = bubble;
    this.obj.step = step.createEmitter({
      x: 0,
      y: 0,
      lifespan: 500,
      alpha: { start: 1, end: 0 },
      follow: this,
      followOffset: 10,
      frequency: 200,
    });

    this.keys = config.scene.input.keyboard.addKeys("W,A,S,D,E,space,shift");
    this.id = Sister.count++;
    this.keys.space.on("down", this.switchEye);
    this.keys.shift.on("down", this.kick);
  }

  update() {
    const input = Object.fromEntries(
      Object.entries(this.keys).map(([key, { isDown }]) => [key, isDown])
    );
    const hasEye = Sister.eye === this.id;

    this.obj.light.setPosition(this.x, this.y);

    if (hasEye) {
      if (Sister.eyed !== this) Sister.eyed = this;

      this.obj.light.setIntensity(1).setRadius(72);

      this.body.setVelocity(
        (input.D + -input.A) * Sister.SPEED,
        (input.S + -input.W) * Sister.SPEED
      );

      if (this.switchEyeNxt) {
        let nxtID = (this.id + 1) % 3;
        let prevID = Phaser.Math.Wrap(this.id - 1, 0, 3);
        if (
          Phaser.Math.Distance.BetweenPoints(Sister.instances[nxtID], this) < 60
        ) {
          Sister.eye = nxtID;
          this.scene.playSound("getsEye");
        } else if (
          Phaser.Math.Distance.BetweenPoints(Sister.instances[prevID], this) <
          60
        ) {
          Sister.eye = prevID;
          this.scene.playSound("getsEye");
        }
        this.switchEyeNxt = false;
      }

      // Make them always follow
      Sister.instances.forEach((sis) => {
        const d = Phaser.Math.Distance.Between(this.x, this.y, sis.x, sis.y);
        if (
          sis !== this &&
          d < 50 &&
          d > 15 &&
          (this.body.velocity.x > 0 || this.body.velocity.y > 0)
        ) {
          sis.wanderDirection =
            -1 * Phaser.Math.Angle.Between(this.x, this.y, sis.x, sis.y) -
            Math.PI * 0.5;
          sis.speedBoost = 1;
        }
      });

      if (input.E) {
        if (this.hoarseness === 0) {
          this.scene.playSound("noise");

          Sister.instances.forEach((sis) => {
            const d = Phaser.Math.Distance.Between(
              this.x,
              this.y,
              sis.x,
              sis.y
            );
            if (sis !== this && d < 72) {
              sis.wanderDirection =
                -1 * Phaser.Math.Angle.Between(this.x, this.y, sis.x, sis.y) -
                Math.PI * 0.5;
              sis.speedBoost = 1;
            }
          });

          this.hoarseness = 30;

          this.obj.bubble.setVisible(true);
        }
      } else if (this.hoarseness > 0) this.hoarseness--;

      if (this.hoarseness === 0) this.obj.bubble.setVisible(false);

      if (this.anger > 0) {
        this.anger -= Sister.CALMING_SPEED;
      }

      this.lps = false;
    } else if (this.anger < this.patientice) {
      if (!this.lps && this.anger > (this.patientice / 3) * 2) {
        this.scene.playSound("lowPatientice");
        this.lps = true;
      }

      this.obj.bubble.setVisible(false);
      this.anger++;
      this.wanderDirection +=
        Math.random() > 0.99 ? Math.floor(Math.random() * 1) - 0.5 : 0;
      this.body.setVelocity(
        Math.sin(this.wanderDirection) *
          (Sister.SPEED / Math.floor(this.speedBoost)),
        Math.cos(this.wanderDirection) *
          (Sister.SPEED / Math.floor(this.speedBoost))
      );

      if (this.speedBoost < 3) this.speedBoost += 0.1;

      this.obj.light.setIntensity(0.5).setRadius(30);
    } else {
      this.wanderDirection +=
        Math.random() > 0.75 ? Math.floor(Math.random() * 11) - 5 : 0;
      this.body.setVelocity(
        Math.cos(this.wanderDirection) * Sister.SPEED,
        Math.sin(this.wanderDirection) * Sister.SPEED
      );
    }

    if (this.kicking) {
      if (this.kicking === 10) this.scene.playSound("kick");
      this.kicking--;
      this.obj.sprite.setFlip(this.scene.input.mousePointer.worldX < this.x);
    } else this.obj.sprite.setTint(0xffffff);

    this.obj.sprite.setFrame(
      hasEye ? (this.kicking ? 1 : 0) : this.anger === this.patientice ? 3 : 2
    );
    this.obj.patienticeBar.width = 8 - (8 / this.patientice) * this.anger;
  }

  switchEye = () => {
    if (Sister.eye === this.id) this.switchEyeNxt = true;
  };

  kick = () => {
    if (Sister.eye === this.id) {
      this.kicking = 10;
    }
  };
}
