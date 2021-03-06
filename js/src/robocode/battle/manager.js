define(["require", "exports", "../lib/utils"], function (require, exports, Utils) {
    var BattleManager = (function () {
        function BattleManager(_canvas) {
            this._canvas = _canvas;
            this._robots = {};
            this._explosions = [];
            this._explosions2 = [];
            this.bulletSpeed = 8;
            this.arena = {
                width: _canvas.getAttribute("width") | 0,
                height: _canvas.getAttribute("height") | 0
            };
            this._ctx = _canvas.getContext("2d");
        }
        BattleManager.prototype.init = function (workers) {
            var self = this, robotId, robot, w, l;
            for (w = 0, l = workers.length; w < l; w++) {
                robotId = "robot-" + w;
                robot = {
                    id: robotId,
                    x: ((this.arena.width - 150) * Math.random()) | 0,
                    y: ((this.arena.height - 150) * Math.random()) | 0,
                    health: 50,
                    direction: Math.random() * 360,
                    turretDirection: Math.random() * 360,
                    radarDirection: Math.random() * 360,
                    bullet: null,
                    events: [],
                    worker: new Worker(workers[w])
                };
                robot.worker.onmessage = (function (robotId) {
                    return function (e) {
                        self._receive(robotId, e.data);
                    };
                })(robotId);
                this._robots[robotId] = robot;
                this._send(robotId, {
                    "signal": "INFO",
                    "arena_height": this.arena.height,
                    "arena_width": this.arena.width
                });
            }
        };
        BattleManager.prototype._receive = function (robotId, msg) {
            var msgObj = JSON.parse(msg), robot = this._robots[robotId];
            switch (msgObj.signal) {
                default:
                    msgObj.progress = 0;
                    robot.events.unshift(msgObj);
                    break;
            }
        };
        BattleManager.prototype._send = function (robotId, msgObj) {
            var msg = JSON.stringify(msgObj);
            this._robots[robotId].worker.postMessage(msg);
        };
        BattleManager.prototype._send_all = function (msgObj) {
            for (var r in this._robots) {
                this._send(r, msgObj);
            }
        };
        BattleManager.prototype.run = function () {
            var _this = this;
            setInterval(function () { return _this._run(); }, 5);
            this._send_all({
                "signal": "RUN"
            });
        };
        BattleManager.prototype._run = function () {
            this._update();
            this._draw();
        };
        BattleManager.prototype._update = function () {
            var self = this, k, e, robot, event, enemyRobot, k2, wallCollide, robotHit;
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
                    wallCollide = !Utils.isPointInSquare(robot.bullet.x, robot.bullet.y, 2, 2, this.arena.width - 2, this.arena.height - 2);
                    if (wallCollide) {
                        robot.bullet = null;
                    }
                    else {
                        for (var r2 in self._robots) {
                            var enemy_robot = self._robots[r2];
                            if (robot.id == enemy_robot.id)
                                continue;
                            robotHit = Utils.distance(robot.bullet.x, robot.bullet.y, enemy_robot.x, enemy_robot.y) < 20;
                            if (robotHit) {
                                enemy_robot.health -= 3;
                                self._explosions.push({
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
                    if (event === undefined)
                        continue;
                    switch (event.signal) {
                        case "SHOOT":
                            if (!robot.bullet)
                                (robot.bullet = {
                                    "x": robot.x,
                                    "y": robot.y,
                                    "direction": robot.direction + robot.turretDirection
                                });
                            break;
                        case "MOVE":
                            event.progress++;
                            var newX = robot.x + (event.distance > 0 ? 1 : -1) * Math.cos(Utils.degrees2radians(robot.direction));
                            var newY = robot.y + (event.distance > 0 ? 1 : -1) * Math.sin(Utils.degrees2radians(robot.direction));
                            wallCollide = !Utils.isPointInSquare(newX, newY, 2, 2, this.arena.width - 2, this.arena.height - 2);
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
                                if (robot.id == enemyRobot.id)
                                    continue;
                                robotHit = Utils.distance(newX, newY, enemyRobot.x, enemyRobot.y) < 25;
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
                            if (robotHit)
                                break;
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
        };
        BattleManager.prototype._draw = function () {
            var _i = 0, k, robot, e, explosion, explosionImg, color = ["black", "red", "orange", "purple"];
            this._ctx.clearRect(0, 0, this.arena.width, this.arena.height);
            for (k in this._robots) {
                robot = this._robots[k];
                this._ctx.save();
                this._ctx.translate(robot.x, robot.y);
                this._ctx.rotate(Utils.degrees2radians(robot.direction));
                BattleManager.drawRobot(this._ctx, robot);
                this._ctx.restore();
                if (robot.bullet) {
                    this._ctx.save();
                    this._ctx.translate(robot.bullet.x, robot.bullet.y);
                    this._ctx.rotate(Utils.degrees2radians(robot.bullet.direction));
                    this._ctx.fillRect(-3, -3, 6, 6);
                    this._ctx.restore();
                }
                this._ctx.beginPath();
                this._ctx.strokeStyle = "red";
                this._ctx.moveTo(robot.x - 40, robot.y);
                this._ctx.lineTo(robot.x + 40, robot.y);
                this._ctx.moveTo(robot.x, robot.y - 40);
                this._ctx.lineTo(robot.x, robot.y + 40);
                this._ctx.stroke();
                this._ctx.closePath();
                this._ctx.font = "10pt Arial";
                this._ctx.strokeText(robot.id + " (" + robot.health + ")", robot.x - 20, robot.y + 35);
                this._ctx.fillStyle = "green";
                this._ctx.fillRect(robot.x - 20, robot.y + 35, robot.health, 5);
                this._ctx.fillStyle = "red";
                this._ctx.fillRect(robot.x - 20 + robot.health, robot.y + 35, 25 - robot.health, 5);
                if (++_i > 3)
                    _i = 0;
                this._ctx.fillStyle = color[_i];
            }
            for (e = 0; e < this._explosions.length; e++) {
                explosion = this._explosions.pop();
                if (explosion.progress <= 17) {
                    explosionImg = new Image();
                    explosionImg.src = "img/explosion/explosion1-" + parseInt(explosion.progress) + '.png';
                    this._ctx.drawImage(explosionImg, explosion.x - 64, explosion.y - 64, 128, 128);
                    explosion.progress += .1;
                    this._explosions.unshift(explosion);
                }
            }
            for (e = 0; e < this._explosions2.length; e++) {
                explosion = this._explosions2.pop();
                if (explosion.progress <= 71) {
                    explosionImg = new Image();
                    explosionImg.src = "img/explosion/explosion2-" + parseInt(explosion.progress) + '.png';
                    this._ctx.drawImage(explosionImg, explosion.x - 64, explosion.y - 64, 128, 128);
                    explosion.progress += .1;
                    this._explosions2.unshift(explosion);
                }
            }
        };
        BattleManager.drawRobot = function (ctx, robot) {
            var body = new Image(), turret = new Image(), radar = new Image();
            body.src = "img/body.png";
            turret.src = "img/turret.png";
            radar.src = "img/radar.png";
            ctx.drawImage(body, -18, -18, 36, 36);
            ctx.rotate(Utils.degrees2radians(robot.turretDirection));
            ctx.drawImage(turret, -25, -10, 54, 20);
            robot.radarDirection++;
            ctx.rotate(Utils.degrees2radians(robot.radarDirection));
            ctx.drawImage(radar, -8, -11, 16, 22);
        };
        return BattleManager;
    })();
    function run(cfg) {
        var Bm = new BattleManager(document.querySelector(cfg.canvasSelector));
        Bm.init(Array(6).join().split('').map(function (_) { return "/js/src/robocode/robots/bot-1.js"; }));
        Bm.run();
        return Bm;
    }
    exports.run = run;
});
//# sourceMappingURL=manager.js.map