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
	worker.addEventListener("message", function (data) {
		QUnit.deepEqual(data.data, {echo: {foobar: "test"}});
		start();
	});
	worker.addEventListener("error", function () {
		ok(false);
		start();
	});
	worker.postMessage({foobar: "test"});
	stop();
});

test("echo worker augmented", function () {
	var worker = new Worker(getWorkerPath("echo_worker_augmented.js"));
	worker = new BetaJS.Workers.Common.AugmentedWorker(worker, []);
	worker.addEventListener("message", function (data) {
		QUnit.deepEqual(data.data, {echo: {foobar: "test"}});
		start();
	});
	worker.addEventListener("error", function () {
		ok(false);
		start();
	});
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
	}).error(function () {
		ok(false);
		start();
	});
});

test("error worker plain", function () {
	var worker = new Worker(getWorkerPath("error_worker_plain.js"));
	worker.addEventListener("message", function (data) {
		ok(false);
		start();
	});
	worker.addEventListener("error", function (e) {
		ok(true);
		start();
		e.preventDefault();
	});
	worker.postMessage({});
	stop();
});
	
test("error worker augmented", function () {
	var worker = new Worker(getWorkerPath("error_worker_augmented.js"));
	worker = new BetaJS.Workers.Common.AugmentedWorker(worker, []);
	worker.addEventListener("message", function (data) {
		ok(false);
		start();
	});
	worker.addEventListener("error", function (e) {
		ok(true);
		start();
		e.preventDefault();
	});
	worker.postMessage({});
	stop();
});

test("error worker rmi", function () {
	var worker = new Worker(getWorkerPath("error_worker_rmi.js"));
	worker = new BetaJS.Workers.Common.AugmentedWorker(worker, ["host:timer"]);
	var client = new BetaJS.RMI.Client();
	client.connectTransport(new BetaJS.Workers.Common.WorkerSenderChannel(worker), new BetaJS.Workers.Common.WorkerReceiverChannel(worker));
	var Error = BetaJS.RMI.Stub.extend("Error", { intf: ["error"] });
	errorStub = client.acquire(Error, "error");
	stop();
	errorStub.error("test").success(function () {
		ok(false);
		start();
	}).error(function () {
		ok(true);
		start();
	});
});
