import eventBoard from "../../eventBoard.js";
import Door from "./Door.js";
import Sister from "./Sister.js";

export default class Spider extends Phaser.Physics.Arcade.Sprite {
	static SPEED = 5;

	deathTimer = -1;
	noiseLevel;
	dead = false;

	constructor(config) {
		super(config.scene, config.x + 4, config.y + 4, "spider");

		config.scene.add.existing(this);
		config.scene.physics.add.existing(this);
		config.scene.updates.push(this);

		config.scene.physics.add.collider(this, config.scene.level);

		this.noiseLevel = Math.random() * 30;

		eventBoard.on("checkspiders", this.checkSpiders);

		this.big = config.big;
		if (this.big) this.setScale(2);

		this.setPipeline("Light2D");
	}

	update() {
		if (this.deathTimer === -1) {
			if (
				this.scene.target.x === Math.floor(this.x / 160) * 160 + 80 &&
				this.scene.target.y === Math.floor(this.y / 96) * 96 + 48
			) {
				const sis = Sister.instances.reduce((s1, s2) =>
					Phaser.Math.Distance.BetweenPoints(s1, this) <
					Phaser.Math.Distance.BetweenPoints(s2, this)
						? s1
						: s2
				);
				const angle = Phaser.Math.Angle.BetweenPoints(this, sis);
				this.setVelocity(
					Math.cos(angle) * Spider.SPEED,
					Math.sin(angle) * Spider.SPEED
				);

				if (
					Phaser.Math.Distance.BetweenPoints(this, sis) < this.noiseLevel &&
					sis.id !== Sister.eye
				) {
					sis.kicking = 8;
				}

				if (this.scene.physics.overlap(this, sis)) {
					if (sis.kicking) {
						this.setVelocity((this.x - sis.x) * 10, -50).setGravity(0, 100);
						this.deathTimer = 30;
						if (this.big) {
							this.scene.sound.stopAll();
							this.scene.soundPlaying = false;
							this.scene.playSound("wilhelm");
							this.scene.sounds.bg2.stop();
						}
					} else {
						sis.patientice -= 50;
						if (sis.patientice === 0) {
							this.scene.start("lose");
							this.scene.stop("gui");
						}
						sis.obj.sprite.setTint(0xff0000);
						this.setVelocity(
							Math.cos(angle) * -Spider.SPEED * 50,
							Math.sin(angle) * -Spider.SPEED * 50
						);
					}
				}
			}
		} else {
			this.deathTimer--;
			this.setAlpha(this.deathTimer / 30);
			console.log(this.deathTimer);
			if (this.deathTimer === 0) {
				this.scene.updates.splice(this.scene.updates.indexOf(this), 1);
				this.dead = true;
				this.destroy();
			}
		}
	}

	checkSpiders = () => {
		if (
			Math.floor(Sister.eyed.x / 160) * 160 ===
				Math.floor(this.x / 160) * 160 &&
			Math.floor(Sister.eyed.y / 96) * 96 === Math.floor(this.y / 96) * 96 &&
			!this.dead
		) {
			Door.SPIDERS_IN_ROOM = true;
			if (this.big) {
				this.scene.sounds.bg2.play({ volume: 0.5 });
			}
		}
	};
}
