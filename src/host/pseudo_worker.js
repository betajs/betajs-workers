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