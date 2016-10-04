Scoped.define("module:Common.AugmentedWorker", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Objs"
], function (Class, EventsMixin, Objs, scoped) {
	return Class.extend({scoped: scoped}, [EventsMixin, function (inherited) {
		return {
			
			constructor: function (worker, augments) {
				inherited.constructor.call(this);
				this.__worker = worker;
				this.__augments = {};
				this.__handlers = {};
				this.__receive = {};
				augments.forEach(function (augment) {
					var augmentCls = this.auto_destroy(new this.cls.augments[augment](this));
					this.__augments[augment] = augmentCls;
					Objs.iter(augmentCls.intf, function (f, key) {
						this.__receive[key] = augmentCls;
					}, this);
				}, this);
				var self = this;
				this.__worker.addEventListener("message", function (data) {
					if (data.data.augment) {
						self._receiveAugment(data.data.augment.message, data.data.augment.data);
					} else if (data.data.data) {
						self.trigger("message", data.data);
					}
				});
			},
			
			postMessage: function (data, transfer) {
				this.__worker.postMessage({data: data}, transfer);
			},

			addEventListener: function (event, callback) {
				if (event === "message") {
					this.on(event, function (data) {
						callback.call(this, data);
					}, this);
				} else {
					this.on(event, callback);
				}
				return this;
			},
			
			augmentCall: function (message, data) {
				this.__worker.postMessage({
					augment: {
						message: message,
						data: data
					}
				});
			},
			
			_receiveAugment: function (message, data)  {
				var obj = this.__receive[message];
				if (obj)
					obj[message].apply(obj, data);
			}
		
		};
	}], {
		
		augments: {}
	
	});
});


Scoped.define("module:Common.WorkerAugment", [
	"base:Class",
	"base:Functions",
	"module:Common.AugmentedWorker"
], function (Class, Functions, AugmentedWorker, scoped) {
	return Class.extend({scoped: scoped}, function (inherited) {
		return {
		
			constructor: function (parent) {
				inherited.constructor.call(this);
				this._parent = parent;
			},
			
			intf: {},
			
			augmentCall: function (method) {
				this._parent.augmentCall(method, Functions.getArguments(arguments, 1));
			}

		};
				
	}, {
		
		register: function (name) {
			AugmentedWorker.augments[name] = this;
			return this;
		}
	
	});
});
