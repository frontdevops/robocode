var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var RobotBase = (function () {
    function RobotBase() {
        this._callbackСounter = 0;
        this._callbackStatus = {};
        this.arena = {
            width: 0,
            height: 0
        };
    }
    RobotBase.prototype.moveForward = function (distance, callback) {
        this._send({
            "signal": "MOVE",
            "distance": distance
        }, callback);
    };
    RobotBase.prototype.moveBackward = function (distance, callback) {
        this._send({
            "signal": "MOVE",
            "distance": -distance
        }, callback);
    };
    RobotBase.prototype.turnLeft = function (angle, callback) {
        this._send({
            "signal": "ROTATE",
            "angle": -angle
        }, callback);
    };
    RobotBase.prototype.turnRight = function (angle, callback) {
        this._send({
            "signal": "ROTATE",
            "angle": angle
        }, callback);
    };
    RobotBase.prototype.turnTurretLeft = function (angle, callback) {
        this._send({
            "signal": "ROTATE_TURRET",
            "angle": -angle
        }, callback);
    };
    RobotBase.prototype.turnTurretRight = function (angle, callback) {
        this._send({
            "signal": "ROTATE_TURRET",
            "angle": angle
        }, callback);
    };
    RobotBase.prototype.turnRadarLeft = function (angle, callback) {
        this._send({
            "signal": "ROTATE_RADAR",
            "angle": -angle
        }, callback);
    };
    RobotBase.prototype.turnRadarRight = function (angle, callback) {
        this._send({
            "signal": "ROTATE_RADAR",
            "angle": angle
        }, callback);
    };
    RobotBase.prototype.shoot = function (callback) {
        this._send({
            "signal": "SHOOT"
        }, callback);
    };
    RobotBase.prototype.receive = function (msg) {
        var msgObj = JSON.parse(msg);
        switch (msgObj.signal) {
            case "CALLBACK":
                var callbacks = this._callbackStatus[msgObj.callbackId];
                if (callbacks) {
                    var callback = callbacks[msgObj["status"]];
                    if (callback) {
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
    };
    RobotBase.prototype._send = function (msgObj, callback) {
        var callbackId = this._callbackСounter++, msg;
        msgObj.callbackId = callbackId;
        msg = JSON.stringify(msgObj);
        this._callbackStatus[callbackId] = callback;
        postMessage(msg);
    };
    RobotBase.prototype._run = function () {
        this.run();
    };
    RobotBase.prototype.run = function () {
    };
    return RobotBase;
})();
var ScanBot = (function (_super) {
    __extends(ScanBot, _super);
    function ScanBot() {
        _super.apply(this, arguments);
    }
    ScanBot.prototype.run = function () {
        var _this = this;
        this.shoot();
        this.turnTurretRight(45);
        this.moveForward(Math.random() * 400, {
            DONE: function () {
                _this.shoot();
                _this.turnRight(Math.random() * 90, {
                    DONE: function () {
                        _this.shoot();
                        _this._run();
                    }
                });
            },
            ENEMY_COLLIDE: function () {
                _this.shoot();
                _this.moveBackward(100, {
                    DONE: function () { return _this._run(); },
                    WALL_COLLIDE: function () { return _this._run(); }
                });
            },
            WALL_COLLIDE: function () { return _this.turnLeft(180, {
                DONE: function () {
                    _this.shoot();
                    _this._run();
                }
            }); }
        });
    };
    return ScanBot;
})(RobotBase);
var bot = new ScanBot();
onmessage = function (e) {
    bot.receive(e.data);
};
//# sourceMappingURL=bot-1.js.map