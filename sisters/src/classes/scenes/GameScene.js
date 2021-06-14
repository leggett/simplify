import { getProperty } from "../../util.js";
import Chest from "../objects/Chest.js";
import Door from "../objects/Door.js";
import Sister from "../objects/Sister.js";
import Spider from "../objects/Spider.js";
import UIScene from "./UIScene.js";

export default class GameScene extends Phaser.Scene {
	updates = [];
	/**
	 * @type {Phaser.GameObjects.Container}
	 *
	 * @memberof GameScene
	 */
	container;

	sounds = {
		random: [],
		kick: [],
		walk: [],
		enterRoom: [],
		clearRoom: [],
		seeSpiders: [],
		getsEye: [],
		lowPatientice: [],
		noise: [],
		wilhelm: []
	};
	soundPlaying = false;

	constructor() {
		super("game");
	}

	preload() {
		this.load.spritesheet("sister", "sprites/sister.png", {
			frameWidth: 8,
			frameHeight: 8
		});
		this.load.spritesheet("chest", "sprites/chest.png", {
			frameWidth: 8,
			frameHeight: 8
		});
		this.load.image("bubble", "sprites/bubble.png");
		this.load.image("step", "sprites/step.png");
		this.load.image("spider", "sprites/spider.png");

		this.load.tilemapTiledJSON("map", "tilemaps/map.json");
		this.load.image("tileset", "sprites/tileset.png");

		// LOAD SOUNDS
		this.load.audio("background-1", ["sounds/background-1.mp3"]);
		this.load.audio("background-2", ["sounds/background-2.mp3"]);
		this.load.audio("ah-ha", ["sounds/ah-ha.m4a"]);
		this.load.audio("are-you-sure", ["sounds/are-you-sure.m4a"]);
		this.load.audio("bathroom", ["sounds/bathroom.m4a"]);
		this.load.audio("chuck-norris", ["sounds/chuck-norris.m4a"]);
		this.load.audio("feet-hurt", ["sounds/feet-hurt.m4a"]);
		this.load.audio("follow-me", ["sounds/follow-me.m4a"]);
		this.load.audio("footsteps-1", ["sounds/footsteps-1.m4a"]);
		this.load.audio("footsteps-2", ["sounds/footsteps-2.m4a"]);
		this.load.audio("give-me-the-eye", ["sounds/give-me-the-eye.m4a"]);
		this.load.audio("grunt", ["sounds/grunt.m4a"]);
		this.load.audio("hmm1", ["sounds/hmm1.m4a"]);
		this.load.audio("hmm2", ["sounds/hmm2.m4a"]);
		this.load.audio("just-tell-him", ["sounds/just-tell-him.m4a"]);
		this.load.audio("keep-up", ["sounds/keep-up.m4a"]);
		this.load.audio("kick-1", ["sounds/kick-1.m4a"]);
		this.load.audio("kick-2", ["sounds/kick-2.m4a"]);
		this.load.audio("kick-3", ["sounds/kick-3.m4a"]);
		this.load.audio("kick-4", ["sounds/kick-4.m4a"]);
		this.load.audio("my-turn-yet", ["sounds/my-turn-yet.m4a"]);
		this.load.audio("nice-curtains", ["sounds/nice-curtains.m4a"]);
		this.load.audio("ninty-nine-bottles", ["sounds/ninty-nine-bottles.m4a"]);
		this.load.audio("other-left", ["sounds/other-left.m4a"]);
		this.load.audio("ouch-my-foot", ["sounds/ouch-my-foot.m4a"]);
		this.load.audio("out-of-my-way", ["sounds/out-of-my-way.m4a"]);
		this.load.audio("over-here", ["sounds/over-here.m4a"]);
		this.load.audio("scream-its-you", ["sounds/scream-its-you.m4a"]);
		this.load.audio("scream-wilhelm", ["sounds/scream-wilhelm.mp3"]);
		this.load.audio("scream1", ["sounds/scream1.m4a"]);
		this.load.audio("scream2", ["sounds/scream2.m4a"]);
		this.load.audio("secret-backdoor", ["sounds/secret-backdoor.m4a"]);
		this.load.audio("something-smells", ["sounds/something-smells.m4a"]);
		this.load.audio("spiders-hate", ["sounds/spiders-hate.m4a"]);
		this.load.audio("spiders-more", ["sounds/spiders-more.m4a"]);
		this.load.audio("spiders-speeders", ["sounds/spiders-speeders.m4a"]);
		this.load.audio("spiders-tastey", ["sounds/spiders-tastey.m4a"]);
		this.load.audio("there-yet", ["sounds/there-yet.m4a"]);
		this.load.audio("toot", ["sounds/toot.m4a"]);
		this.load.audio("want-the-eye-no", ["sounds/want-the-eye-no.m4a"]);
		this.load.audio("want-the-eye", ["sounds/want-the-eye.m4a"]);
		this.load.audio("were-lost", ["sounds/were-lost.m4a"]);
		this.load.audio("what-do-you-see", ["sounds/what-do-you-see.m4a"]);
		this.load.audio("you-cant-navigate", ["sounds/you-cant-navigate.m4a"]);
	}

	create() {
		const map = this.add.tilemap("map", 8, 8);
		map.addTilesetImage("tileset", "tileset");
		this.level = map.createLayer("map", "tileset");
		this.level.setCollisionByProperty({ collide: true }).setPipeline("Light2D");

		this.container = this.add.container(0, 0, [
			new Sister({
				scene: this,
				x: 1344,
				y: 840
			}),

			new Sister({
				scene: this,
				x: 1356,
				y: 840
			}),

			new Sister({
				scene: this,
				x: 1364,
				y: 840
			})
		]);

		const objs = [];

		map
			.getObjectLayer("objects")
			.objects.forEach(({ type, id, x, y, properties }) => {
				switch (type) {
					case "door":
						objs[id] = new Door({
							scene: this,
							x,
							y,
							win: getProperty(properties, "win")
						});
						break;

					case "spider":
						this.container.add(
							new Spider({
								scene: this,
								x,
								y
							})
						);
						break;

					case "spiderbig":
						this.container.add(
							new Spider({
								scene: this,
								x,
								y,
								big: true
							})
						);
						break;

					case "chest":
						this.container.add(
							new Chest({
								scene: this,
								x,
								y
							})
						);

					default:
						break;
				}
			});

		map
			.getObjectLayer("objects")
			.objects.forEach(({ type, properties, id }) => {
				switch (type) {
					case "door": {
						if (!properties) console.log(id);
						if (getProperty(properties, "exit")) {
							objs[id].exit = objs[getProperty(properties, "exit")];
						} else {
							const door = objs[id];
							const exit = objs
								.filter((o) => o instanceof Door)
								.reduce((d1, d2, i) =>
									d2 === door
										? d1
										: d1 === door
										? d2
										: Phaser.Math.Distance.BetweenPoints(door, d1) <
										  Phaser.Math.Distance.BetweenPoints(door, d2)
										? d1
										: d2
								);
							if (exit.exit === undefined) {
								door.exit = exit;
								exit.exit = door;
							}
						}
						break;
					}

					default:
						break;
				}
			});

		this.lights.enable();

		this.target = this.add.image(100, 100);
		this.cameras.main.setZoom(5).startFollow(this.target, false);

		// CATEGORIZE SOUNDS
		this.sounds.bg1 = this.sound.add("background-1").play({ volume: 0.15 });
		this.sounds.bg2 = this.sound.add("background-2");

		this.sounds.random.push(
			this.sound.add("are-you-sure"),
			this.sound.add("bathroom"),
			this.sound.add("feet-hurt"),
			this.sound.add("grunt"),
			this.sound.add("hmm1"),
			this.sound.add("hmm2"),
			this.sound.add("keep-up"),
			this.sound.add("nice-curtains"),
			this.sound.add("ninty-nine-bottles"),
			this.sound.add("ouch-my-foot"),
			this.sound.add("out-of-my-way"),
			this.sound.add("scream-its-you"),
			this.sound.add("scream1"),
			this.sound.add("scream2"),
			this.sound.add("something-smells"),
			this.sound.add("there-yet"),
			this.sound.add("toot"),
			this.sound.add("were-lost")
		);

		this.sounds.kick.push(
			this.sound.add("kick-1"),
			this.sound.add("kick-2"),
			this.sound.add("kick-3"),
			this.sound.add("kick-4")
		);

		this.sounds.walk.push(
			this.sound.add("footsteps-1"),
			this.sound.add("footsteps-2")
		);

		this.sounds.enterRoom.push(
			this.sound.add("ah-ha"),
			this.sound.add("are-you-sure"),
			this.sound.add("other-left"),
			this.sound.add("over-here"),
			this.sound.add("scream1"),
			this.sound.add("scream2"),
			this.sound.add("secret-backdoor")
		);

		this.sounds.clearRoom.push(
			this.sound.add("chuck-norris"),
			this.sound.add("follow-me"),
			this.sound.add("keep-up"),
			this.sound.add("nice-curtains"),
			this.sound.add("out-of-my-way")
		);

		this.sounds.seeSpiders.push(
			this.sound.add("spiders-hate"),
			this.sound.add("spiders-more"),
			this.sound.add("spiders-speeders"),
			this.sound.add("spiders-tastey")
		);

		this.sounds.getsEye.push(
			this.sound.add("hmm1"),
			this.sound.add("hmm2"),
			this.sound.add("out-of-my-way"),
			this.sound.add("what-do-you-see")
		);

		this.sounds.lowPatientice.push(
			this.sound.add("feet-hurt"),
			this.sound.add("give-me-the-eye"),
			this.sound.add("grunt"),
			this.sound.add("just-tell-him"),
			this.sound.add("my-turn-yet"),
			this.sound.add("there-yet"),
			this.sound.add("want-the-eye-no"),
			this.sound.add("want-the-eye"),
			this.sound.add("were-lost"),
			this.sound.add("you-cant-navigate")
		);

		this.sounds.noise.push(
			this.sound.add("grunt"),
			this.sound.add("follow-me"),
			this.sound.add("keep-up"),
			this.sound.add("hmm1"),
			this.sound.add("hmm2")
		);

		this.sounds.wilhelm.push(this.sound.add("scream-wilhelm"));

		this.scene.add("ui", UIScene, true);
	}

	update() {
		this.updates.forEach((o) => o.update());

		this.container.sort("y");

		this.target.setPosition(
			Math.floor(Sister.eyed.x / 160) * 160 + 80,
			Math.floor(Sister.eyed.y / 96) * 96 + 48
		);

		if (Math.random() > 0.999) this.playSound("random");
	}

	playSound(key) {
		if (!this.soundPlaying) {
			const soundList = this.sounds[key];
			/** @type {Phaser.Sound.BaseSound} */
			const sound = soundList[Math.floor(Math.random() * soundList.length)];
			this.soundPlaying = true;
			sound.on("complete", this.completeSound);
			sound.play();
			return true;
		}
		return false;
	}

	completeSound = () => {
		this.soundPlaying = false;
	};
}
