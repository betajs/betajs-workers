var pth = "../..";
if (typeof setTimeout === "undefined")
	pth = ".";
self.importScripts(pth + "/vendors/scoped.js", pth + "/vendors/beta-noscoped.js", pth + "/dist/betajs-workers-noscoped.js");

var worker = new BetaJS.Workers.Common.AugmentedWorker(self, ["client:timer"]);

var server = new BetaJS.RMI.Server();

server.registerTransportClient(
	new BetaJS.Workers.Common.WorkerSenderChannel(worker),
	new BetaJS.Workers.Common.WorkerReceiverChannel(worker)
);

var Echo = BetaJS.RMI.Skeleton.extend("Error", {
	intf: ["error"],
	
	error: function (data) {
		throw data;
	}

});

server.registerInstance(new Error(), { name : "error" });

