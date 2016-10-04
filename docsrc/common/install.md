You can use the library in the browser, in your NodeJS project, webworkers and compile it as well.

#### Browser

```javascript
	<script src="betajs/dist/betajs.min.js"></script>
	<script src="betajs-workers/dist/betajs-workers.min.js"></script>
``` 

#### NodeJS

```javascript
	var BetaJS = require('betajs/dist/beta.js');
	require('betajs-workers/dist/betajs-workers.js');
```

#### Compile

```javascript
	git clone https://github.com/betajs/betajs-workers.git
	npm install
	grunt
```