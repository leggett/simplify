import eventBoard from "../../eventBoard.js";
import Sister from "./Sister.js";

export default class Door extends Phaser.Physics.Arcade.Image {
	static SPIDERS_IN_ROOM = false;

	/**
	 * @type {Door}
	 *
	 * @memberof Door
	 */
	exit;

	win = false;

	/**
	 * Creates an instance of Door.
	 * @param {object} config
	 * @param {Phaser.Scene} config.scene
	 * @memberof Sister
	 */
	constructor(config) {
		super(config.scene, config.x + 4, config.y + 4);

		config.scene.add.existing(this);
		config.scene.physics.add.existing(this, true);

		Sister.instances.forEach((sis) => {
			config.scene.physics.add.overlap(sis, this, this.teleport);
		});

		this.win = config.win;

		this.setSize(4, 4);
	}

	/**
	 * @param {Sister} obj
	 * @memberof Door
	 */
	teleport = (obj) => {
		if (this.exit) {
			if (obj.id === Sister.eye)
				Sister.instances.forEach((sis) => {
					if (
						Phaser.Math.Distance.BetweenPoints(obj, sis) <= 50 &&
						sis.id !== Sister.eye
					) {
						sis.setPosition(
							this.exit.x + Math.sign(obj.body.velocity.x) * 10,
							this.exit.y + Math.sign(obj.body.velocity.y) * 10
						);
					}
				});

			obj.setPosition(
				this.exit.x + Math.sign(obj.body.velocity.x) * 10,
				this.exit.y + Math.sign(obj.body.velocity.y) * 10
			);

			Door.SPIDERS_IN_ROOM = false;
			eventBoard.emit("checkspiders");
			if (Door.SPIDERS_IN_ROOM) {
				this.scene.playSound("seeSpiders");
			} else if (Math.random() > 0.6) this.scene.playSound("enterRoom");
		} else if (this.win) {
			this.scene.scene.start("win");
			this.scene.scene.stop("ui");
		}
	};
}
