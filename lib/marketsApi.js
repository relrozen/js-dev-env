import https from 'https';

export default class {
	static _get(host, path, cb) {
		https.request({ host: host, path: path }, (response) => {
			var str = '';

			//another chunk of data has been recieved, so append it to `str`
			response.on('data', function (chunk) {
				str += chunk;
			});

			//the whole response has been recieved, so we just print it out here
			response.on('end', function () {
				cb(str);
			});
		}).end();
	}

	static getDealingData(symbol, cb) {
		this._get("api-v2.markets.com",`/dealingdata?key=1&q=${symbol}`, (str) => {
			try {
				cb(JSON.parse(str));
			}
			catch(e) {
				cb(null);
			}
		});
	}

	static getQuote(symbol, cb) {
		this._get("api-v2.markets.com",`/quotesv2?key=1&q=${symbol}`, (str) => {
			try {
				cb(JSON.parse(str));
			}
			catch(e) {
				cb(null);
			}
		});
	}
}
