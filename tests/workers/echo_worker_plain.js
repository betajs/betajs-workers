self.addEventListener("message", function (data) {
	self.postMessage({echo: data.data});
});
