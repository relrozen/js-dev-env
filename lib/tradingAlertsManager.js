import fs from 'fs';
import _ from 'lodash';
import snakeCase from 'snake-case';

const sentimentAlertHtmlTemplate = fs.readFileSync('./templates/sentiment.template.html', 'utf8');
const sentimentAlertCss = fs.readFileSync('./templates/sentiment.template.css', 'utf8');

const ALERT_TYPE = "TRADE_ALERT";

export default class {
	constructor(clientConnections, localization) {
		this._clientConnections = clientConnections;
		this._localization = localization;
	}

	process(message) {
		switch (message.subtype) {
			case "sentiment":
				this._processSentimentAlert(message);
				break;
		}
	}

	_processSentimentAlert(message) {
		var translatedHtml = this._localization.translateHtml(sentimentAlertHtmlTemplate, 'en');
		var replacedHtml = this._globalReplace(translatedHtml, message.data)
			.replace(/__COLOR__/g, (message.data.dailyChange >= 0) ? 'green' : 'red')
			.replace(/__SENTIMENT_COLOR__/g, (message.data.percentBuying >= 50) ? 'green' : 'red')
			.replace(/__SENTIMENT_PERCENT__/g, (message.data.percentBuying >= 50) ? message.data.percentBuying : message.data.percentSelling)
			.replace(/__BUYING_TEXT_DISPLAY__/g, (message.data.percentBuying >= 50) ? 'block' : 'none')
			.replace(/__SELLING_TEXT_DISPLAY__/g, (message.data.percentBuying >= 50) ? 'none' : 'block')
			.replace(/__UP_ARROW_DISPLAY__/g, (message.data.dailyChange >= 0) ? 'block' : 'none')
			.replace(/__DOWN_ARROW_DISPLAY__/g, (message.data.dailyChange >= 0) ? 'none' : 'block')
			.replace(/__INSTRUMNET_FONT_SIZE__/g, (message.data.instrument.length < 20) ? '27px' : '17px');
		this._clientConnections.broadcastMessage("both", ALERT_TYPE, {
			alertType: ALERT_TYPE,
			html: replacedHtml,
			css: sentimentAlertCss,
			actions: [
				{
					action: 'openInstrumentPage',
					args: [message.data.symbol]
				}
			]
		});
	}

	_globalReplace(htmlTemplate, data) {
		_.forEach(data, function(val, key) {
			var regex = new RegExp(`__${snakeCase(key).toUpperCase()}__`, 'g');
			htmlTemplate = htmlTemplate.replace(regex, val);
		});
		return htmlTemplate;
	}
}
