class PrescriptedScene extends Phaser.Scene {
	actionIndex = 0;
	sprites = {};
	dialog;

	constructor(config) {
		super(config.id);

		this.script = config.json;
		this.id = config.id;
	}

	preload() {
		console.log(this.script);

		this.script.images.forEach(({ key, url }) => {
			this.load.image(key, url);
		});

		this.load.image(`background-${this.id}`, this.script.bgImage);
	}

	create() {
		this.add.image(0, 0, `background-${this.id}`).setOrigin(0);

		this.script.sprites.forEach(({ name, key, x, y }) => {
			this.sprites[name ?? key] = this.physics.add.sprite(x, y, key);
		});

		this.nextAction();

		this.cameras.main.setZoom(5).setScroll(-320, -192);
	}

	nextAction = () => {
		const act = this.script.actions[this.actionIndex++];

		if (this.dialog) {
			this.dialog.destroy();
			this.dialog = null;
		}

		if (act)
			switch (act.type) {
				case "wait":
					this.time.addEvent({
						delay: act.delay,
						callback: this.nextAction
					});
					break;

				case "move":
					this.physics.moveTo(
						this.sprites[act.sprite],
						act.x,
						act.y,
						1,
						act.time
					);
					this.time.addEvent({
						delay: act.time,
						callback: () => {
							this.sprites[act.sprite].body.stop();
							this.nextAction();
						}
					});
					break;

				case "rotate":
					this.sprites[act.sprite].setRotation(act.rot);
					this.nextAction();
					break;

				case "dialog":
					this.dialog = this.add
						.text(400, act.y, act.speaker + "\n" + act.text)
						.setOrigin(0.5, 0)
						.setAlign("center")
						.setScrollFactor(0)
						.setFontSize(8)
						.setFontFamily("Zepto")
						.setScale(0.7)
						.setShadow(0, 0, 0x000000, 5, true, true);
					this.time.addEvent({
						delay: 4000,
						callback: this.nextAction
					});

				default:
					break;
			}
		else this.scene.start(this.script.next);
	};
}

export default function createPrescriptedScene(id, json) {
	return class extends PrescriptedScene {
		constructor() {
			super({ id, json });
		}
	};
}
