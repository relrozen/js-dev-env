import fs from 'fs';

export default class {
	constructor() {
		this._local = JSON.parse(fs.readFileSync('./localization/localization.json', 'utf8'));
	}

	getTranslation(key, language) {
		let texts = this._local[key];
		if (!texts) {
			return null;
		}
		return texts[language] || texts['en'] || null;
	}

	translateHtml(htmlString, language) {
		let regex = /{{(.*)}}/g;
		let match;
		var htmlCopy = htmlString;
		do {
			match = regex.exec(htmlString);
			if (match) {
				htmlCopy = htmlCopy.replace(new RegExp(match[0], 'g'), this.getTranslation(match[1], language));
			}
		} while (match);
		return htmlCopy;
	}
}
