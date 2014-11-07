define(["require", "exports", "utils"], function (require, exports, Utils) {
    var Controller = (function () {
        function Controller(x, y, source) {
            this.x = x;
            this.y = y;
            this.source = source;
            this.health = 100;
            this.angle = 0;
            this.turretAngle = 0;
            this.radarAngle = 0;
            this.bullet = null;
            this.events = {};
            this._initWorker(source);
        }
        Controller.prototype._initWorker = function (source) {
            var _this = this;
            this.worker = new Worker(source);
            this.worker.onmessage = function (e) { return _this.receive(e.data); };
        };
        Controller.prototype.move = function (distance) {
            this.x += distance * Math.cos(Utils.degrees2radians(this.angle));
            this.y += distance * Math.sin(Utils.degrees2radians(this.angle));
            return {
                x: this.x,
                y: this.y
            };
        };
        Controller.prototype.turn = function (degrees) {
            return this.angle += degrees;
        };
        Controller.prototype.receive = function (msg) {
            var event;
            event = JSON.parse(msg);
            event.progress = 0;
            return this.events.eventId = event;
        };
        Controller.prototype.send = function (sender) {
            return this.worker.postMessage(JSON.stringify(sender));
        };
        Controller.prototype.update = function () {
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
                }
                else {
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
                action: "update",
                x: this.x,
                y: this.y
            });
        };
        return Controller;
    })();
    exports.Controller = Controller;
});
//# sourceMappingURL=robot.js.map