/*!
betajs-workers - v0.0.1 - 2016-10-04
Copyright (c) Oliver Friedmann
Apache-2.0 Software License.
*/

(function () {
var Scoped = this.subScope();
Scoped.binding('module', 'global:BetaJS.Workers');
Scoped.binding('base', 'global:BetaJS');
Scoped.define("module:", function () {
	return {
    "guid": "9f1e96ea-528c-4110-83f8-76fa9a8900d3",
    "version": "1.1475608783940"
};
});
Scoped.assumeVersion('base:version', 557);
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

Scoped.define("module:Common.WorkerSenderChannel", [
    "base:Channels.Sender",
    "base:Objs"
], function (Sender, Objs, scoped) {
	return Sender.extend({scoped: scoped}, function (inherited) {
		
		/**
		 * Worker Sender Channel Class
		 * 
		 * @class BetaJS.Workers.Common.WorkerSenderChannel
		 */
		return {
			
			/**
			 * Creates a new instance.
			 * 
			 * @param {object} worker worker object
			 */
			constructor: function (worker) {
				inherited.constructor.call(this);
				this.__worker = worker || self;
			},
			
			/**
			 * @override
			 */
			_send: function (message, data, serializerInfo) {
				var transfer = [];
				if (serializerInfo) {
					Objs.iter(serializerInfo, function (value, key) {
						if (value && value.transfer && data[key])
							transfer.push(data[key]);
					}, this);
				}
				this.__worker.postMessage({
					message: message,
					data: data
				}, transfer);
			}
			
		};
	});
});


Scoped.define("module:Common.WorkerReceiverChannel", [
    "base:Channels.Receiver"
], function (Receiver, scoped) {
	return Receiver.extend({scoped: scoped}, function (inherited) {
		
		/**
		 * Worker Receiver Channel Class
		 * 
		 * @class BetaJS.Workers.Common.WorkerReceiverChannel
		 */
		return {
					
			/**
			 * Creates a new instance.
			 * 
			 * @param {object} worker worker object
			 */
			constructor: function (worker) {
				inherited.constructor.call(this);
				this.__worker = worker || self;
				var _this = this;
				this.__worker.addEventListener("message", function (data) {
					_this._receive(data.data.message, data.data.data);
				});
		    }
	
		};
	});
});

Scoped.define("module:Host.TimerAugment", [
	"module:Common.WorkerAugment"
], function (WorkerAugment, scoped) {
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

Scoped.define("module:Host.PseudoWorker", [
    "base:Class",
    "base:Events.EventsMixin"
], function (Class, EventsMixin, scoped) {
	
	/**
	 * PseudoWorker Class, emulating a worker in the same thread.
	 * 
	 * @class BetaJS.Workers.PseudoWorker
	 */
	return Class.extend({scoped: scoped}, [EventsMixin, {
		
		/**
		 * Bind peer pseudo worker.
		 * 
		 * @param {object} peerWorker Peer pseudo worker
		 */
		bind: function (peerWorker) {
			this.__peer = peerWorker;
			return this;
		},
		
		/**
		 * Post message to peer.
		 * 
		 * @param data Data to be posted
		 */
		postMessage: function (data, transfer) {
			this.__peer.triggerAsync("message", data);
		},
		
		/**
		 * Add event listener to pseudo worker.
		 * 
		 * @param {string} event Event to listen to
		 * @param {function} callback Callback function
		 */
		addEventListener: function (event, callback) {
			if (event === "message") {
				this.on(event, function (data) {
					callback.call(this, {data : data});
				}, this);
			} else {
				this.on(event, callback);
			}
			return this;
		}

	}], {		
		
		/**
		 * Try to create a new native worker.
		 * 
		 * @param {string} url URL for worker
		 * @return {object} Worker object or null
		 */
		createWorker: function (url) {
			try {
				return new Worker(url);
			} catch (e) {
				return null;
			}
		},
		
		/**
		 * Create a new pseudo worker instance.
		 * 
		 * @param {function} workerFactory Factory function for setting up the worker
		 * @param {object} workerFactoryCtx Context for factory function
		 * @return {object} New pseudo worker object
		 */
		createPseudoWorker: function (workerFactory, workerFactoryCtx) {
			var clientWorker = new this();
			var serverWorker = clientWorker.auto_destroy(new this());
			clientWorker.bind(serverWorker);
			serverWorker.bind(clientWorker);
			workerFactory.call(workerFactoryCtx || this, serverWorker);
			return clientWorker;
		},
		
		/**
		 * Creates a new native worker and falls back to pseudo worker if not possible.
		 * 
		 * @param {string} url URL for worker
		 * @param {function} workerFactory Factory function for setting up the worker
		 * @param {object} workerFactoryCtx Context for factory function
		 * @return {object} New worker object
		 */
		createAsFallback: function (url, workerFactory, workerFactoryCtx) {
			return this.createWorker(url) || this.createPseudoWorker(workerFactory, workerFactoryCtx);
		}
		
	});
});
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

}).call(Scoped);