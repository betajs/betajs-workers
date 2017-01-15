var pth = "../..";
if (typeof setTimeout === "undefined")
	pth = ".";
self.importScripts(pth + "/node_modules/betajs-scoped/dist/scoped.js", pth + "/node_modules/betajs/dist/beta-noscoped.js", pth + "/dist/betajs-workers-noscoped.js");

var worker = new BetaJS.Workers.Common.AugmentedWorker(self, []);

worker.addEventListener("message", function (data) {
	worker.postMessage({echo: data.data});
});
