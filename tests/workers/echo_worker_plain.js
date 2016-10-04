self.onmessage = function (data) {
	self.postMessage({echo: data.data});
};
