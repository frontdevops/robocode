define(["require", "exports", "lib/assets", "lib/robot", "lib/utils"], function (require, exports, Assets, Robot, Utils) {
    var Battle = (function () {
        function Battle(ctx, width, height, sources) {
            var _this = this;
            this.ctx = ctx;
            this.width = width;
            this.height = height;
            var assets = {
                turret: "img/turret.png",
                radar: "img/radar.png",
                body: "img/body.png"
            }, i = 0;
            this.explosions = [];
            this.robots = sources.map(function (source) { return new Robot.Controller(Math.random() * _this.width, Math.random() * _this.height, source); });
            for (i = 1; i < 18; i++) {
                assets["explosion1-" + i] = "img/explosion/explosion1-" + i + ".png";
            }
            this.assets = new Assets.Loader(assets);
        }
        Battle.prototype.run = function () {
            this.sendAll({ action: "run" });
            return this._run();
        };
        Battle.prototype._run = function () {
            var _this = this;
            this._update();
            this._draw();
            return setTimeout(function () { return _this._run(); }, 10);
        };
        Battle.prototype.sendAll = function (msg_obj) {
            return this.robots.map(function (robot) { return robot.send(msg_obj); });
        };
        Battle.prototype._update = function () {
            return this.robots.map(function (robot) { return robot.update(); });
        };
        Battle.prototype._draw = function () {
            var _this = this;
            this.ctx.clearRect(0, 0, this.width, this.height);
            return this.robots.map(function (robot) {
                _this.ctx.save();
                _this.ctx.translate(robot.x, robot.y);
                _this.ctx.rotate(Utils.degrees2radians(robot.angle));
                _this.ctx.drawImage(_this.assets.get("body"), -(38 / 2), -(36 / 2), 38, 36);
                _this.ctx.rotate(Utils.degrees2radians(robot.turretAngle));
                _this.ctx.drawImage(_this.assets.get("turret"), -(54 / 2), -(20 / 2), 54, 20);
                _this.ctx.rotate(Utils.degrees2radians(robot.radarAngle));
                _this.ctx.drawImage(_this.assets.get("radar"), -(16 / 2), -(22 / 2), 16, 22);
                return _this.ctx.restore();
            });
        };
        return Battle;
    })();
});
//# sourceMappingURL=battle.js.map