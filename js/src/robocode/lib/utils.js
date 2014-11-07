define(["require", "exports"], function (require, exports) {
    function degrees2radians(degrees) {
        return degrees * (Math.PI / 180);
    }
    exports.degrees2radians = degrees2radians;
    function distance() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return euclidDistance.apply(this, args);
    }
    exports.distance = distance;
    function euclidDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    exports.euclidDistance = euclidDistance;
    function inRect(x1, y1, x2, y2, width, height) {
        return ((x2 + width) > x1 && x1 > x2) && ((y2 + height) > y1 && y1 > y2);
    }
    exports.inRect = inRect;
    function isPointInSquare() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return inRect.apply(this, args);
    }
    exports.isPointInSquare = isPointInSquare;
});
//# sourceMappingURL=utils.js.map