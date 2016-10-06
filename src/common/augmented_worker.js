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
					if (data.data.augment)
						self._receiveAugment(data.data.augment.message, data.data.augment.data);
					else if (data.data.data)
						self._receiveMessage(data.data);
				});
				this.__worker.addEventListener("error", function (e) {
					self._receiveError(e);
				});
			},
			
			worker: function () {
				return this.__worker;
			},
			
			postMessage: function (data, transfer) {
				this.__worker.postMessage({data: data}, transfer);
				return this;
			},

			addEventListener: function (event, callback) {
				this.on(event, callback);
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
					obj.intf[message].apply(obj, data);
			},
			
			_receiveMessage: function (data) {
				this.trigger("message", data);
				if (this.onmessage)
					this.onmessage(data);
			},
			
			_receiveError: function (e) {
				this.trigger("error", e);
				if (this.onerror)
					this.onerror(e);
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
				this.__parent = parent;
			},
			
			intf: {},
			
			parent: function () {
				return this.__parent;
			},
			
			augmentCall: function (method) {
				this.__parent.augmentCall(method, Functions.getArguments(arguments, 1));
			}

		};
				
	}, {
		
		register: function (name) {
			AugmentedWorker.augments[name] = this;
			return this;
		}
	
	});
});
