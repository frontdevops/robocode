class RobotBase {
	public _callbackСounter = 0;
	public _callbackStatus = {};
	public arena = {
		width : 0,
		height: 0
	};
	public x:number;
	public y:number;

	constructor() {
		//
	}

	moveForward(distance, callback?) {
		this._send({
			"signal": "MOVE",
			"distance": distance
		}, callback);
	}

	moveBackward(distance, callback?) {
		this._send({
			"signal": "MOVE",
			"distance": -distance
		}, callback);
	}

	turnLeft(angle, callback?) {
		this._send({
			"signal": "ROTATE",
			"angle": -angle
		}, callback);
	}

	turnRight(angle, callback?) {
		this._send({
			"signal": "ROTATE",
			"angle": angle
		}, callback);
	}

	turnTurretLeft(angle, callback) {
		this._send({
			"signal": "ROTATE_TURRET",
			"angle": -angle
		}, callback);
	}

	turnTurretRight(angle, callback?) {
		this._send({
			"signal": "ROTATE_TURRET",
			"angle": angle
		}, callback);
	}

	turnRadarLeft(angle, callback?) {
		this._send({
			"signal": "ROTATE_RADAR",
			"angle": -angle
		}, callback);
	}

	turnRadarRight(angle, callback?) {
		this._send({
			"signal": "ROTATE_RADAR",
			"angle": angle
		}, callback);
	}

	shoot(callback?) {
		this._send({
			"signal": "SHOOT"
		}, callback);
	}

	receive(msg) {
		var msgObj = JSON.parse(msg);

		switch(msgObj.signal) {
			case "CALLBACK":
				var callbacks = this._callbackStatus[msgObj.callbackId];
				if(callbacks) {
					var callback = callbacks[msgObj.status];
					if(callback) {
						callback();

					}
					delete this._callbackStatus[msgObj.callbackId];
				}
				break;
			case "INFO":
				this.arena.width = msgObj.arenaWidth;
				this.arena.height = msgObj.arenaHeight;
				break;
			case "UPDATE":
				this.x = msgObj.x;
				this.y = msgObj.y;
				break;
			case "RUN":
				this._run();
				break;
		}
	}

	public _send(msgObj, callback) {
		var callbackId = this._callbackСounter++,
			msg;

		msgObj.callbackId = callbackId;

		msg = JSON.stringify(msgObj);

		this._callbackStatus[callbackId] = callback;

		(<any>postMessage)(msg);
	}

	public _run() {
		this.run();
	}

	run() {}

	public static exec(bot:RobotBase) {
		onmessage = function(e) {
			bot.receive(e.data);
		};
	}
}

class TestBot extends RobotBase {

	run() {
		this.shoot();
		this.turnTurretRight(45);
		this.moveForward(Math.random() * 400,
			{
				DONE: () => {
					this.shoot();
					this.turnRight(
						Math.random() * 90,
						{
							DONE: () => {
								this.shoot();
								this._run();
							}
						}
					);
				},

				ENEMY_COLLIDE: () => {
					this.shoot();
					this.moveBackward(100, {
						DONE: () => this._run(),
						WALL_COLLIDE: () => this._run()
					});
				},

				WALL_COLLIDE: () =>
					this.turnLeft(180, {
						DONE: () => {
							this.shoot();
							this._run();
						}
					})
			}
		);
	}
}

RobotBase.exec(new TestBot);
