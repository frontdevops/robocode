import Utils = require("../lib/utils");

class BattleManager {
	public _robots = {};

	public _explosions: any = [];
	public _explosions2: any = [];

	public bulletSpeed = 8;

	public arena;

	private _ctx;

	constructor(private _canvas){

		this.arena = {
			width : _canvas.getAttribute("width") |0,
			height: _canvas.getAttribute("height")|0
		};

		this._ctx = (<HTMLCanvasElement> _canvas).getContext("2d");
	}

	init(workers) {
		var robotId: string,
			robot: any,
			w: number,
			l: number;

		for (w = 0, l = workers.length; w < l; w++) {
			robotId = "robot-" + w;

			robot = {
				id: robotId,
				x: ((this.arena.width - 150) * Math.random()) |0,
				y: ((this.arena.height - 150) * Math.random())|0,
				health: 50,
				direction: Math.random() * 360,
				turretDirection: Math.random() * 360,
				radarDirection: Math.random() * 360,
				bullet: null,
				events: [],
				worker: new Worker(workers[w])
			};

			robot.worker.onmessage = (robotId => {
					return e =>
						this._receive(robotId, e.data);
				})(robotId);

			this._robots[robotId] = robot;

			this._send(robotId, {
				"signal": "INFO",
				"arena_height": this.arena.height,
				"arena_width": this.arena.width
			});
		}
	}

	_receive(robotId, msg) {
		var msgObj = JSON.parse(msg),
			robot = this._robots[robotId];

		switch (msgObj.signal) {
			default:
				msgObj.progress = 0;
				robot.events.unshift(msgObj);
				break;
		}
	}

	_send(robotId, msgObj) {
		var msg = JSON.stringify(msgObj);
		this._robots[robotId].worker.postMessage(msg);
	}

	_send_all(msgObj) {
		for (var r in this._robots) {
			this._send(r, msgObj);
		}
	}

	run() {
		setInterval(() => this._run(), 5);

		this._send_all({
			"signal": "RUN"
		});
	}

	_run() {
		this._update();
		this._draw()
	}

	_update() {
		var k, e, robot, event, enemyRobot,
			k2, newX, newY,
			wallCollide: boolean,
			robotHit: boolean;

		for (k in this._robots) {
			robot = this._robots[k];
			if (robot.health <= 0) {
				delete this._robots[k];
				this._explosions2.push({
					x: robot.x,
					y: robot.y,
					progress: 1
				});
			}
		}

		for (k in this._robots) {
			robot = this._robots[k];

			if (robot.bullet) {
				robot.bullet.x += this.bulletSpeed * Math.cos(Utils.degrees2radians(robot.bullet.direction));
				robot.bullet.y += this.bulletSpeed * Math.sin(Utils.degrees2radians(robot.bullet.direction));

				wallCollide = !Utils.isPointInSquare(
					robot.bullet.x, robot.bullet.y,
					2, 2,
					this.arena.width - 2, this.arena.height - 2
				);

				if (wallCollide) {
					robot.bullet = null;
				} else {
					for (var r2 in this._robots) {
						var enemy_robot = this._robots[r2];

						if (robot.id == enemy_robot.id) continue;

						robotHit = Utils.distance(
								robot.bullet.x, robot.bullet.y,
								enemy_robot.x, enemy_robot.y
							) < 20;

						if (robotHit) {
							enemy_robot.health -= 3;
							this._explosions.push({
								"x": enemy_robot.x,
								"y": enemy_robot.y,
								"progress": 1
							});

							robot.bullet = null;
							break;
						}
					}
				}
			}

			for (e = 0; e < robot.events.length; e++) {
				event = robot.events.pop();
				if (event === undefined) continue;


				switch (event.signal) {
					case "SHOOT":
						if (!robot.bullet) (
							robot.bullet = {
								"x": robot.x,
								"y": robot.y,
								"direction": robot.direction + robot.turretDirection
							}
						)
						break;
					case "MOVE":
						event.progress++;

						newX = robot.x + (event.distance > 0 ? 1 : -1) * Math.cos(Utils.degrees2radians(robot.direction));
						newY = robot.y + (event.distance > 0 ? 1 : -1) * Math.sin(Utils.degrees2radians(robot.direction));

						wallCollide = !Utils.isPointInSquare(
							newX, newY,
							2, 2,
							this.arena.width - 2, this.arena.height - 2
						);

						if (wallCollide) {
							robot.health -= 1;
							this._send(k, {
								"signal": "CALLBACK",
								"callbackId": event.callbackId,
								"status": "WALL_COLLIDE"
							});
							break;
						}

						for (k2 in this._robots) {
							enemyRobot = this._robots[k2];

							if (robot.id == enemyRobot.id) continue;

							robotHit = Utils.distance(
									newX, newY,
									enemyRobot.x, enemyRobot.y
								) < 25;

							if (robotHit) {
								enemyRobot.health--;
								robot.health--;
								this._send(k, {
									"signal": "CALLBACK",
									"callbackId": event.callbackId,
									"status": "ENEMY_COLLIDE"
								});
								break;
							}
						}

						if (robotHit) break;

						if (event.progress > Math.abs(event.distance)) {
							this._send(k, {
								"signal": "CALLBACK",
								"callbackId": event.callbackId,
								"status": "DONE"
							});
							break;
						}

						robot.x = newX;
						robot.y = newY;
						robot.events.unshift(event);

						break;
					case "ROTATE":
						if (event.progress == Math.abs(parseInt(event.angle))) {
							this._send(k, {
								"signal": "CALLBACK",
								"callbackId": event.callbackId,
								"status": "DONE"
							});
							break;

						}

						robot.direction += (event.angle > 0 ? 1 : -1);
						event.progress++;
						robot.events.unshift(event);

						break;
					case "ROTATE_TURRET":
						if (event.progress == Math.abs(event.angle)) {
							this._send(k, {
								"signal": "CALLBACK",
								"callbackId": event.callbackId
							});
							break;

						}

						robot.turretDirection += (event.angle > 0 ? 1 : -1);
						event.progress++;
						robot.events.unshift(event);

						break;
				}

				this._send(k, {
					"signal": "UPDATE",
					"x": robot.x,
					"y": robot.y
				});
			}
		}
	}

	_draw() {
		var _i = 0,
			k, robot, e, explosion, explosionImg,
			color = ["black", "red", "orange", "purple"],
			ctx = this._ctx;

		ctx.clearRect(0, 0, this.arena.width, this.arena.height);

		// draw robots
		for (k in this._robots) {
			robot = this._robots[k];

			// draw robot
			ctx.save();
			ctx.translate(robot.x, robot.y);
			ctx.rotate(Utils.degrees2radians(robot.direction));

			this.drawRobot(robot);

			ctx.restore();

			// draw bullet
			if (robot.bullet) {
				ctx.save();
				ctx.translate(robot.bullet.x, robot.bullet.y);
				ctx.rotate(Utils.degrees2radians(robot.bullet.direction));
				ctx.fillRect(-3, -3, 6, 6);
				ctx.restore();
			}

			ctx.beginPath();
			ctx.strokeStyle = "red";
			ctx.moveTo(robot.x - 40, robot.y);
			ctx.lineTo(robot.x + 40, robot.y);
			ctx.moveTo(robot.x, robot.y - 40);
			ctx.lineTo(robot.x, robot.y + 40);
			ctx.stroke();
			ctx.closePath();

			ctx.font = "10pt Arial";
			ctx.strokeText(robot.id + " (" + robot.health + ")", robot.x - 20, robot.y + 35);


			ctx.fillStyle = "green";
			ctx.fillRect(robot.x - 20, robot.y + 35, robot.health, 5);

			ctx.fillStyle = "red";
			ctx.fillRect(robot.x - 20 + robot.health, robot.y + 35, 25 - robot.health, 5);

			if (++_i > 3) _i = 0;
			ctx.fillStyle = color[_i];
		}

		for (e = 0; e < this._explosions.length; e++) {
			explosion = this._explosions.pop();
			if (explosion.progress <= 17) {
				explosionImg = new Image();
				explosionImg.src = "img/explosion/explosion1-" + parseInt(explosion.progress) + '.png';
				ctx.drawImage(explosionImg, explosion.x - 64, explosion.y - 64, 128, 128);
				explosion.progress += .1;
				this._explosions.unshift(explosion);
			}
		}

		for (e = 0; e < this._explosions2.length; e++) {
			explosion = this._explosions2.pop();
			if (explosion.progress <= 71) {
				explosionImg = new Image();
				explosionImg.src = "img/explosion/explosion2-" + parseInt(explosion.progress) + '.png';
				ctx.drawImage(explosionImg, explosion.x - 64, explosion.y - 64, 128, 128);
				explosion.progress += .1;
				this._explosions2.unshift(explosion);
			}
		}
	}

	drawRobot(robot) {
		var body = new Image(),
			turret = new Image(),
			radar = new Image();

		body.src 	= "img/body.png";
		turret.src 	= "img/turret.png";
		radar.src 	= "img/radar.png";

		this._ctx.drawImage(body, -18, -18, 36, 36);
		this._ctx.rotate(Utils.degrees2radians(robot.turretDirection));
		this._ctx.drawImage(turret, -25, -10, 54, 20);

		robot.radarDirection++;

		this._ctx.rotate(Utils.degrees2radians(robot.radarDirection));
		this._ctx.drawImage(radar, -8, -11, 16, 22);
	}

}

export function run(cfg){

	var Bm = new BattleManager(
		document.querySelector(cfg.canvasSelector)
		//(<HTMLCanvasElement> document.querySelector(cfg.canvasSelector)).getContext("2d")
	);

	// Create 5 bots
	Bm.init(
		Array(6)
			.join()
			.split('') // N-1 = 6-1
			.map( _=> "/js/src/robocode/robots/bot-1.js" )
	);

	Bm.run();

	return Bm;
}
