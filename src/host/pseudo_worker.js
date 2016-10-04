Scoped.define("module:Host.PseudoWorker", [
    "base:Class",
    "base:Events.EventsMixin"
], function (Class, EventsMixin, scoped) {
	
	/**
	 * PseudoWorker Class, emulating a worker in the same thread.
	 * 
	 * @class BetaJS.Workers.Host.PseudoWorker
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
		postMessage: function (data) {
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