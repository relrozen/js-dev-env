import crypto from 'crypto';
import config from 'config';

const algorithm = 'aes-128-cbc';
const encConfig = config.get('encryption');

export default class {

	static encrypt(data, key) {
		try {
			var encKey = this._md5(key || encConfig.key);
			encKey = encKey.substr(0, 16);
			var iv = this._md5(encKey).substr(0,16);
			var cipher = crypto.createCipheriv(algorithm, encKey, iv);
			var crypted = cipher.update(data,'utf-8','hex');
			return crypted + cipher.final('hex');
		} catch(e) {
			return '';
		}
	}

	static decrypt(data, key) {
		try {
			var encKey = this._md5(key || encConfig.key);
			encKey = encKey.substr(0, 16);
			var iv = this._md5(encKey).substr(0,16);
			var decipher = crypto.createDecipheriv(algorithm, encKey, iv);
			var decrypted = decipher.update(data, 'hex', 'utf-8');
			return decrypted + decipher.final('utf8');
		} catch(e) {
			return '';
		}
	}

	static _md5(data) {
		return crypto.createHash('md5').update(data).digest("hex");
	}
}
