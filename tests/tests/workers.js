var getWorkerPath = function (s) {
	return "workers/" + s + "?" + BetaJS.Time.now();
};

if (module && ("exports" in module)) {
	global.Worker = require("webworker-threads").Worker;
	getWorkerPath = function (s) {
		return "tests/workers/" + s;
	};
}
	

test("echo worker plain", function () {
	var worker = new Worker(getWorkerPath("echo_worker_plain.js"));
	worker.onmessage = function (data) {
		QUnit.deepEqual(data.data, {echo: {foobar: "test"}});
		start();
	};
	worker.postMessage({foobar: "test"});
	stop();
});

test("echo worker rmi", function () {
	var worker = new Worker(getWorkerPath("echo_worker_rmi.js"));
	worker = new BetaJS.Workers.Common.AugmentedWorker(worker, ["host:timer"]);
	var client = new BetaJS.RMI.Client();
	client.connectTransport(new BetaJS.Workers.Common.WorkerSenderChannel(worker), new BetaJS.Workers.Common.WorkerReceiverChannel(worker));
	var Echo = BetaJS.RMI.Stub.extend("Echo", { intf: ["echo"] });
	echoStub = client.acquire(Echo, "echo");
	stop();
	echoStub.echo({foobar: "test"}).success(function (data) {
		QUnit.deepEqual(data, {echo: {foobar: "test"}});
		start();
	});
});
