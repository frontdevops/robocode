
import Utils = require("utils");

export class Controller {

	public health: number;
	public angle: number;
	public turretAngle: number;
	public radarAngle: number;
	public bullet: any;
	public events: any;
	public worker: any;

	constructor(public x:number, public y:number, public source) {

		this.health = 100;
		this.angle = 0; //Math.random() * 360;
		this.turretAngle = 0; //Math.random() * 360;
		this.radarAngle = 0; //Math.random() * 360;

		this.bullet = null;
		this.events = {};

		this._initWorker(source);
	}

	private _initWorker(source) {
		this.worker = new Worker(source);
		this.worker.onmessage = (e) => this.receive(e.data);
	}

	public move(distance:number) {

		this.x += distance * Math.cos(Utils.degrees2radians(this.angle));
		this.y += distance * Math.sin(Utils.degrees2radians(this.angle));

		return {
			x: this.x,
			y: this.y
		}
	}

	public turn(degrees:number) {
		return this.angle += degrees;
	}

	public receive(msg) {

		var event;

		event = JSON.parse(msg);
		event.progress = 0;

		return this.events.eventId = event;
	}

	public send(sender) {
		return this.worker.postMessage(JSON.stringify(sender));
	}

	public update() {

		var event, eventId, ref;

		ref = this.events;

		for (eventId in ref) {
			event = ref[eventId];

			if (event.amount === event.progress) {

				this.send({
					"action": "callback",
					"event_id": event.eventId
				});

				delete this.events[eventId];

			} else {

				switch (event.action) {
					case "moveForwards":
						event.progress++;
						this.move(1);
						break;
					case "moveBackwards":
						event.progress++;
						this.move(-1);
						break;
					case "turnLeft":
						event.progress++;
						this.turn(-1);
						break;
					case "turnRight":
						event.progress++;
						this.turn(1);
				}

			}
		}

		return this.send({
			action	: "update",
			x		: this.x,
			y		: this.y
		});
	}
}
