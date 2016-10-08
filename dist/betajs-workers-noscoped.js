/*!
betajs-workers - v0.0.5 - 2016-10-08
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
    "version": "5.1475944405984"
};
});
Scoped.assumeVersion('base:version', 557);
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
						if (value && value.transfer && data.data[key])
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


Scoped.define("module:Host.PseudoWorker", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Functions",
    "module:Common.AugmentedWorker"
], function (Class, EventsMixin, Functions, AugmentedWorker, scoped) {
	
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
		 * @param {array} augments optional augments
		 * @return {object} Worker object or null
		 */
		createWorker: function (url, augments) {
			try {
				var worker = new Worker(url);
				if (augments && augments.length > 0)
					return new AugmentedWorker(worker, augments);
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
		 * @param {array} augments optional augments array
		 * @param {function} workerFactory Factory function for setting up the worker
		 * @param {object} workerFactoryCtx Context for factory function
		 * @return {object} New worker object
		 */
		createAsFallback: function () {
			var args = Functions.matchArgs(arguments, {
				url: true,
				augments: "array",
				workerFactory: true,
				workerFactoryCtx: "object"
			});
			return this.createWorker(args.url, args.augments) || this.createPseudoWorker(args.workerFactory, args.workerFactoryCtx);
		}
		
	});
});
}).call(Scoped);