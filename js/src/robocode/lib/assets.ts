
export class Loader {

	private _resources: number;
	private _resources_loaded: number;

	constructor(public assets, public callback?) {

		var name,
			uri;

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
			this.assets[name].onload = () => {
				this._resources_loaded++;
				if (this._resources_loaded === this._resources && typeof this.callback === "function") {
					return this.callback();
				}
			};
		}
	}

	public isDoneLoading() {
		return this._resources_loaded === this._resources;
	}

	public get(asset_name) {
		return this.assets[asset_name];
	}
}
