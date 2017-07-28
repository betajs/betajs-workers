Scoped.define("module:Host.TimerAugment", [
	"module:Common.WorkerAugment",
	"base:Objs"
], function (WorkerAugment, Objs, scoped) {
	return WorkerAugment.extend({scoped: scoped}, function (inherited) {
		return {
						
			constructor: function (parent) {
				inherited.constructor.call(this, parent);
				this.__timeouts = {};
				this.__intervals = {};
			},
			
			destroy: function () {
				Objs.iter(this.__timeouts, function (handle) {
					clearTimeout(handle);
				});
				Objs.iter(this.__timeouts, function (handle) {
					clearTimeout(handle);
				});
				inherited.destroy.call(this);
			},

			intf: {
				setTimeout: function (id, delay) {
					var self = this;
					this.__timeouts[id] = setTimeout(function () {
						self.augmentCall("timeoutCallback", id);
						delete self.__timeouts[id];
					}, delay);
				},
				
				setInterval: function (delay, id) {
					var self = this;
					this.__intervals[id] = setInterval(function () {
						self.augmentCall("intervalCallback", id);
					}, delay);
				},
				
				clearTimeout: function (id) {
					if (id in this.__timeouts) {
						clearTimeout(this.__timeouts[id]);
						delete this.__timeouts[id];
					}
				},
				
				clearInterval: function (id) {
					if (id in this.__intervals) {
						clearInterval(this.__intervals[id]);
						delete this.__intervals[id];
					}
				}
			}
			
		};
	}).register("host:timer");
});



Scoped.define("module:Host.LocalStorageAugment", [
	"module:Common.WorkerAugment"
], function (WorkerAugment, scoped) {
	return WorkerAugment.extend({scoped: scoped}, function (inherited) {
		return {
						
			intf: {
				localStorageGetItem: function (item, id) {
					this.augmentCall("localStorageGetItemCallback", localStorage.getItem(item), id);
				},
				
				localStorageSetItem: function (item, value) {
					localStorage.setItem(item, value);
				},
				
				localStorageRemoveItem: function (item) {
					localStorage.removeItem(item);
				}
			}
			
		};
	}).register("host:localStorage");
});

