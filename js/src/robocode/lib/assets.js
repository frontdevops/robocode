define(["require", "exports"], function (require, exports) {
    var Loader = (function () {
        function Loader(assets, callback) {
            var _this = this;
            this.assets = assets;
            this.callback = callback;
            var name, uri;
            this._resources = 0;
            this._resources_loaded = 0;
            for (name in assets) {
                uri = assets[name];
                this._resources++;
                this.assets[name] = new Image();
                this.assets[name].src = uri;
            }
            for (name in assets) {
                uri = assets[name];
                this.assets[name].onload = function () {
                    _this._resources_loaded++;
                    if (_this._resources_loaded === _this._resources && typeof _this.callback === "function") {
                        return _this.callback();
                    }
                };
            }
        }
        Loader.prototype.isDoneLoading = function () {
            return this._resources_loaded === this._resources;
        };
        Loader.prototype.get = function (asset_name) {
            return this.assets[asset_name];
        };
        return Loader;
    })();
    exports.Loader = Loader;
});
//# sourceMappingURL=assets.js.map