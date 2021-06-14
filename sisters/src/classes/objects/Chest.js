import Sister from "./Sister.js";

export default class Chest extends Phaser.Physics.Arcade.Sprite {
	/**
	 * Creates an instance of Chest.
	 * @param {object} config
	 * @param {Phaser.Scene} config.scene
	 * @memberof Sister
	 */
	constructor(config) {
		super(config.scene, config.x + 4, config.y - 4, "chest");

		config.scene.add.existing(this);
		config.scene.physics.add.existing(this, true);

		Sister.instances.forEach((sis) => {
			config.scene.physics.add.collider(this, sis, this.open);
		});

		this.setPipeline("Light2D");
	}

	open = () => {
		this.setFrame(1);
	};
}
