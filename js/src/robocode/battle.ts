
import Assets	= require("lib/assets");
import Robot	= require("lib/robot");
import Utils	= require("lib/utils");

class Battle {

	public explosions;
	public robots: any[];
	public assets: Assets.Loader;

    constructor(public ctx, public width, public height, sources) {

		var assets = {
				turret	: "img/turret.png",
				radar	: "img/radar.png",
				body	: "img/body.png"
			},
			i: number = 0;

		this.explosions = [];

        this.robots = sources.map(
			(source) =>
				new Robot.Controller(Math.random() * this.width, Math.random() * this.height, source)
		);

		for (i = 1; i < 18; i++) {
			assets["explosion1-" + i] = "img/explosion/explosion1-" + i + ".png";
		}

        this.assets = new Assets.Loader(assets);
    }

    public run() {
        this.sendAll({ action: "run" });
        return this._run();
    }

    private _run() {

        this._update();
        this._draw();

        return setTimeout(() => this._run(), 10);
    }

    public sendAll(msg_obj) {
        return this.robots.map((robot) => robot.send(msg_obj));
    }

    private _update() {
        return this.robots.map((robot) => robot.update());
    }

    private _draw() {

        this.ctx.clearRect(0, 0, this.width, this.height);

        return this.robots.map((robot) => {
            // draw robot
            this.ctx.save();
            this.ctx.translate(robot.x, robot.y);
            this.ctx.rotate(Utils.degrees2radians(robot.angle));
            this.ctx.drawImage(this.assets.get("body"), -(38 / 2), -(36 / 2), 38, 36);
            this.ctx.rotate(Utils.degrees2radians(robot.turretAngle));
            this.ctx.drawImage(this.assets.get("turret"), -(54 / 2), -(20 / 2), 54, 20);
            this.ctx.rotate(Utils.degrees2radians(robot.radarAngle));
            this.ctx.drawImage(this.assets.get("radar"), -(16 / 2), -(22 / 2), 16, 22);
            return this.ctx.restore();
        });
    }
}

