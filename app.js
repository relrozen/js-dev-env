import MessageConsumer from './lib/messageConsumer';
import ClientConnections from './lib/clientConnections';
import TradingAlertsManager from './lib/tradingAlertsManager';
import Localization from './lib/localization';

let localization  = new Localization();

let clientConnections = new ClientConnections();

let tradingAlertsManger = new TradingAlertsManager(clientConnections, localization);

let messageConsumer = new MessageConsumer();

messageConsumer.register(function(message) {
	switch(message.type) {
		case "trade-alert":
			tradingAlertsManger.process(message);
			break;
	}
});

// setInterval(function() {
// 	clientConnections.broadcastMessage("both", { a: 1 });
// }, 3000);
