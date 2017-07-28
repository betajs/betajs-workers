var getWorkerPath = function (s) {
	return "workers/" + s + "?" + BetaJS.Time.now();
};
if (module && ("exports" in module)) {
	global.Worker = require("webworker-threads").Worker;
	getWorkerPath = function (s) {
		return "tests/workers/" + s;
	};
}
	

QUnit.test("echo worker plain", function (assert) {
	var worker = new Worker(getWorkerPath("echo_worker_plain.js"));
	worker.addEventListener("message", function (data) {
		assert.deepEqual(data.data, {echo: {foobar: "test"}});
		worker.terminate();
		done();
	});
	worker.addEventListener("error", function () {
        assert.ok(false);
		done();
	});
	worker.postMessage({foobar: "test"});
	var done = assert.async();
});


QUnit.test("echo worker augmented", function (assert) {
    var workerInner = new Worker(getWorkerPath("echo_worker_augmented.js"));
    worker = new BetaJS.Workers.Common.AugmentedWorker(workerInner, []);
    worker.addEventListener("message", function (data) {
        assert.deepEqual(data.data, {echo: {foobar: "test"}});
        worker.destroy();
        workerInner.terminate();
        done();
    });
    worker.addEventListener("error", function () {
        assert.ok(false);
        done();
    });
    worker.postMessage({foobar: "test"});
    var done = assert.async();
});

QUnit.test("echo worker rmi", function (assert) {
    var workerInner = new Worker(getWorkerPath("echo_worker_rmi.js"));
    worker = new BetaJS.Workers.Common.AugmentedWorker(workerInner, ["host:timer"]);
    var client = new BetaJS.RMI.Client();
    var sender = new BetaJS.Workers.Common.WorkerSenderChannel(worker);
    var receiver = new BetaJS.Workers.Common.WorkerReceiverChannel(worker);
    client.connectTransport(sender, receiver);
    var Echo = BetaJS.RMI.Stub.extend("Echo", { intf: ["echo"] });
    echoStub = client.acquire(Echo, "echo");
    var done = assert.async();
    echoStub.echo({foobar: "test"}).success(function (data) {
        assert.deepEqual(data, {echo: {foobar: "test"}});
        client.destroy();
        worker.destroy();
        workerInner.terminate();
        done();
    }).error(function () {
        assert.ok(false);
        done();
    });
});

QUnit.test("error worker plain", function (assert) {
    var done = assert.async();
    var worker = new Worker(getWorkerPath("error_worker_plain.js"));
    worker.addEventListener("message", function (data) {
        assert.ok(false);
        done();
    });
    worker.addEventListener("error", function (e) {
        worker.terminate();
        assert.ok(true);
        done();
        e.preventDefault();
    });
    worker.postMessage({});
});

QUnit.test("error worker augmented", function (assert) {
    var done = assert.async();
    var workerInner = new Worker(getWorkerPath("error_worker_augmented.js"));
    worker = new BetaJS.Workers.Common.AugmentedWorker(workerInner, []);
    worker.addEventListener("message", function (data) {
        assert.ok(false);
        done();
    });
    worker.addEventListener("error", function (e) {
        assert.ok(true);
        worker.destroy();
        workerInner.terminate();
        done();
        e.preventDefault();
    });
    worker.postMessage({});
});

QUnit.test("error worker rmi", function (assert) {
    var workerInner = new Worker(getWorkerPath("error_worker_rmi.js"));
    worker = new BetaJS.Workers.Common.AugmentedWorker(workerInner, ["host:timer"]);
    var client = new BetaJS.RMI.Client();
    client.connectTransport(new BetaJS.Workers.Common.WorkerSenderChannel(worker), new BetaJS.Workers.Common.WorkerReceiverChannel(worker));
    var Error = BetaJS.RMI.Stub.extend("Error", { intf: ["error"] });
    errorStub = client.acquire(Error, "error");
    var done = assert.async();
    errorStub.error("test").success(function () {
        assert.ok(false);
        done();
    }).error(function () {
        assert.ok(true);
        client.destroy();
        worker.destroy();
        workerInner.terminate();
        done();
    });
});
