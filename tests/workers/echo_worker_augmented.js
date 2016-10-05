var pth = "../..";
if (typeof setTimeout === "undefined")
	pth = ".";
self.importScripts(pth + "/vendors/scoped.js", pth + "/vendors/beta-noscoped.js", pth + "/dist/betajs-workers-noscoped.js");

var worker = new BetaJS.Workers.Common.AugmentedWorker(self, []);

worker.addEventListener("message", function (data) {
	worker.postMessage({echo: data.data});
});
