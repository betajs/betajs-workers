Scoped.define("module:Client.TimerAugment", [
	"module:Common.WorkerAugment",
	"base:Functions",
	"base:Objs"
], function (WorkerAugment, Functions, Objs, scoped) {
	return WorkerAugment.extend({scoped: scoped}, function (inherited) {
		return {
						
			constructor: function (parent) {
				inherited.constructor.call(this, parent);
				var self = this;
				this.__id = 0;
				this.__names = [];
				this.__callbacks = {};
				Objs.iter(this.send, function (method, name) {
					if (Scoped.getGlobal(name))
						return;
					Scoped.setGlobal(name, Functions.as_method(method, this));
					this.__names.push(name);
				}, this);
			},
			
			send: {
				setTimeout: function (func, delay) {
					this.__id++;
					this.__callbacks[this.__id] = func;
					this.augmentCall("setTimeout", this.__id, delay);
					return this.__id;
				},
			
				setInterval: function (func, delay) {
					this.__id++;
					this.__callbacks[this.__id] = func;
					this.augmentCall("setTimeout", this.__id, delay);
					return this.__id;
				},
				
				clearTimeout: function (id) {
					this.augmentCall("clearTimeout", id);
					delete this.__callbacks[id];
				},
				
				clearInterval: function (id) {
					this.augmentCall("clearInterval", id);
					delete this.__callbacks[id];
				}

			},
			
			destroy: function () {
				Objs.iter(this.__names, function (name) {
					Scoped.setGlobal(name, null);
				});
				inherited.destroy.call(this);
			},

			intf: {
				timeoutCallback: function (id) {
					if (this.__callbacks[id]) {
						this.__callbacks[id].call(this);
						delete this.__callbacks[id];
					}
				},

				intervalCallback: function (id) {
					if (this.__callbacks[id])
						this.__callbacks[id].call(this);
				}
			}
			
		};
	}).register("client:timer");
});




Scoped.define("module:Client.LocalStorageAugment", [
	"module:Common.WorkerAugment",
	"base:Promise",
	"base:Objs",
	"base:Functions"
], function (WorkerAugment, Promise, Objs, Functions, scoped) {
	return WorkerAugment.extend({scoped: scoped}, function (inherited) {
		return {
						
			constructor: function (parent) {
				inherited.constructor.call(this, parent);
				this.__id = 0;
				this.__callbacks = {};
				if (!Scoped.getGlobal("localStorage")) {
					Scoped.setGlobal("localStorage", Objs.map(this.send, function (method) {
						return Functions.as_method(method, this);
					}, this));
				}
			},
			
			send: {
				getItem: function (item) {
					this.__id++;
					this.__callbacks[this.__id] = Promise.create();
					this.augmentCall("localStorageGetItem", item, this.__id);
					return this.__callbacks[this.__id];
				},
				
				setItem: function (item, value) {
					this.augmentCall("localStorageSetItem", item, value);
				},
				
				removeItem: function (item) {
					this.augmentCall("localStorageRemoveItem", item);
				}
			},
			
			intf: {
				localStorageGetItemCallback: function (value, id) {
					if (this.__callbacks[id]) {
						this.__callbacks[id].asyncSuccess(value);
						delete this.__callbacks[id];
					}
				}
			}
			
		};
	}).register("client:localStorage");
});

