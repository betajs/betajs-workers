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
			},
			
			receive: ["timeoutCallback", "intervalCallback"]
			
		};
	}).register("client:timer");
});
