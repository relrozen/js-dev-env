import config from 'config';
import kafka from 'kafka-node';

export default class {

	constructor() {
		this._messageHandlers = [];
		this._messageConsumer = null;

		const kafkaConfig = config.get('kafka');
		const HighLevelConsumer = kafka.HighLevelConsumer;
		const kafkaClient = new kafka.Client(kafkaConfig.connectionString, kafkaConfig.clientId);

		this._messageConsumer = new HighLevelConsumer(kafkaClient, [ { topic: kafkaConfig.topicName } ], { groupId: 'my-group'});

		this._messageConsumer.on("error", (err) => {
			console.error(err);
		});

		this._messageConsumer.on("offsetOutOfRange", (err) => {
			console.error(err);
		});
	}

	register(onMessageHandler) {
		this._messageHandlers.push(onMessageHandler);

		if (this._messageHandlers.length === 1) {
			this._messageConsumer.on('message', (message) => {
				console.log(message);
				this._messageHandlers.forEach(function(handler) {
					handler(JSON.parse(message.value));
				})
			});
		}
	}
}
