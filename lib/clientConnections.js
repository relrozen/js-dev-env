import config from 'config';
import _ from 'lodash';
import io from 'socket.io';
import http from 'http';
import encryption from './encryption';
import mysql from 'mysql';

const port = 8080;
const MESSAGE_TYPE_NAME = 'MESSAGE_TO_CLIENT';

const ipmMysqlConnectionDetails = config.get("in_platform_messaging");
const ipmMysqlConnection = mysql.createConnection({
	host     : ipmMysqlConnectionDetails.host,
	user     : ipmMysqlConnectionDetails.username,
	password : ipmMysqlConnectionDetails.password,
	database : ipmMysqlConnectionDetails.db
});
ipmMysqlConnection.connect();

export default class {
	constructor() {
		var self = this;

		self.init = () => {
			self._io = null;
			self._clients = {};

			let server = http.Server();
			self._io = io(server);

			self._io.use(self._authorize);

			self._io.on('connection', self._handleNewConnection);

			self._io.listen(port);
		};

		self.getUserLanguage = (cId) => {
			var client = self._clients[cId];
			if (client && client.connections.length > 0) {
				return client.language;
			}
			return null;
		};

		self.isClientConnected = (cId, accountType) => {
			var client = self._clients[cId];
			if (client && client.connections.length > 0) {
				if (!accountType || accountType === 'both') {
					return true;
				}
				for (var i=0; i<client.connection.length; i++) {
					var conn = client.connection[i];
					if (conn.accountType === accountType) {
						return true;
					}
				}
				return false;
			}
		};

		self.sendMessage = (cId, accountType, message) => {
			var res = false;
			if (self._clients[cId] && self._clients[cId].connections.length > 0) {
				self._clients[cId].connections.forEach(function(conn) {
					if (accountType === 'both' || accountType === conn.accountType) {
						conn.socket.emit(MESSAGE_TYPE_NAME, message);
						res = true;
					}
				});
			}
			return res;
		};

		self.broadcastMessage = (accountType, alertType, message) => {
			self._getOptOutCids(alertType, (cIds) => {
				if (cIds === null) {
					console.log("Error in getting opt out customers. dropping message...");
				}
				else {
					_.forEach(self._clients, function (client, cId) {
						if (!cIds.includes(cId)) {
							self.sendMessage(cId, accountType, message);
						}
					});
				}
			});
		};

		self._getOptOutCids = (alertType, cb) => {
			const getOptOut = `
			SELECT customer_id 
			FROM customers 
			WHERE alert_type = '${alertType}'
			AND opt_out_expire > NOW()`;
			ipmMysqlConnection.query(getOptOut, (err, rows) => {
				if (err) {
					console.log(err);
					cb(null);
				}
				else {
					cb(_.map(rows, (o) => { return o.customer_id; }))
				}
			})

		};

		self._authorize = (socket, next) => {
			let decryptedCId = encryption.decrypt(socket.handshake.query.token);
			if (socket.handshake.query.cId === decryptedCId) {
				return next();
			}
			else {
				next(new Error('Authentication error'));
			}
		};

		self._handleNewConnection = (socket) =>{
			let cId = socket.handshake.query.cId;
			let language = socket.handshake.query.lang || 'en';
			let isReal = socket.handshake.query.isreal;

			self._clients[cId] = self._clients[cId] || {};
			self._clients[cId].language = language;
			self._clients[cId].connections = self._clients[cId].connections || [];
			self._clients[cId].connections.push({
				socket: socket,
				accountType: isReal ? "real" : "demo"
			});

			socket.on('disconnect', () => {
				self._handleConnectionClose(cId, socket)
			});

			socket.on('OPT_OUT', (data) => {
				self._updateOptOut(data.alertType, data.cId, data.days);
			});
		};

		self._handleConnectionClose = (cId, socket) => {
			var client = self._clients[cId];
			if (client && client.connections) {
				var i = _.findIndex(client.connections, (con) => {
					return con.socket === socket
				});
				if (i !== -1) {
					client.connections.splice(i, 1);
				}
			}
		};

		self._updateOptOut = (alertType, cId, days) =>{
			const insertOptOut = `
				INSERT INTO customers (customer_id, alert_type, opt_out_expire) VALUES ('${cId}', '${alertType}', NOW() + INTERVAL ${days} DAY)
				ON DUPLICATE KEY UPDATE opt_out_expire=NOW() + INTERVAL ${days} DAY;`;
			ipmMysqlConnection.query(insertOptOut, (err, rows) => {
				if (err) {
					console.log(err);
				}
			})
		};

		self.init();
	}
}
