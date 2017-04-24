import config from 'config';
import kafka from 'kafka-node';
import mysql from 'mysql';
import marketsApi from './lib/marketsApi';
import _ from 'lodash';

const SENTIMENT_THRESHOLD = 80;
const SENTIMENT_MEMORY_SIZE = 10;

const kafkaConfig = config.get('kafka');
const HighLevelProducer = kafka.HighLevelProducer;
const client = new kafka.Client(kafkaConfig.connectionString, kafkaConfig.clientId);
const producer = new HighLevelProducer(client);

const etlMysqlConnectionDetails = config.get("etl");
const etlMysqlSentimentConnection = mysql.createConnection({
	host     : etlMysqlConnectionDetails.host,
	user     : etlMysqlConnectionDetails.username,
	password : etlMysqlConnectionDetails.password,
	database : etlMysqlConnectionDetails.db
});
etlMysqlSentimentConnection.connect();

const ipmMysqlConnectionDetails = config.get("in_platform_messaging");
const ipmMysqlConnection = mysql.createConnection({
	host     : ipmMysqlConnectionDetails.host,
	user     : ipmMysqlConnectionDetails.username,
	password : ipmMysqlConnectionDetails.password,
	database : ipmMysqlConnectionDetails.db
});
ipmMysqlConnection.connect();

const queryAll = `
	SELECT symbol, instrument_id, price, round(percentage_of_longs_positions,1) AS perc_long, round(percentage_of_shorts_positions,1) AS perc_short 
	FROM instrument_sentiments
	WHERE total_num_of_positions >= 50
	AND (percentage_of_longs_positions > 80 OR percentage_of_shorts_positions > ${SENTIMENT_THRESHOLD})`;

const queryGetLatestMessages = `
		SELECT instrument
		FROM trade_alerts
		WHERE subtype = 'sentiment'
		ORDER BY send_time DESC
		LIMIT ${SENTIMENT_MEMORY_SIZE}`;

const adaptTo100 = ((rowPercLong, rowPercShort) => {
	if (rowPercLong + rowPercShort < 100) {
		if (rowPercLong < rowPercShort) {
			return [rowPercLong + (100 - (rowPercLong + rowPercShort)), rowPercShort];
		} else {
			return [rowPercLong, rowPercShort + (100 - (rowPercLong + rowPercShort))];
		}
	} else {
		if (rowPercLong < rowPercShort) {
			return [rowPercLong + ((rowPercLong + rowPercShort) - 100), rowPercShort];
		} else {
			return [rowPercLong, rowPercShort + ((rowPercLong + rowPercShort) - 100 )];
		}
	}
});

const getSentimentToSend = ((rows, cb) => {
	ipmMysqlConnection.query(queryGetLatestMessages, (err, latestMessages) => {
		if (err) {
			console.log(err);
			process.exit();
		}
		else {
			var found = null;
			var symbol;
			for (var i=0; i<rows.length; i++) {
				symbol = rows[i].symbol.toLowerCase();
				if (!_.find(latestMessages, { instrument: symbol })) {
					found = i;
					break;
				}
			}
			if (found !== null) {
				cb(rows[found]);
			}
			else {
				console.log('could not find a message to show');
				process.exit();

			}
		}
	})
});

producer.on('ready', () => {
	etlMysqlSentimentConnection.query(queryAll, (err, rows) => {
		if (err) throw err;

		rows = _.map(rows, (row) => {
			const percs = adaptTo100(row.perc_long, row.perc_short);
			return {
				symbol: row.symbol,
				instrumentId: row.instrument_id,
				price: row.price,
				percentageOfLongs: percs[0],
				percentageOfShorts: percs[1]
			};
		});
		rows = _.sortBy(rows, (row) => {
			return (row.percentageOfLongs > row.percentageOfShorts ? -row.percentageOfLongs : -row.percentageOfShorts);
		});

		getSentimentToSend(rows, (selectedSentiment) => {
			const symbol = selectedSentiment.symbol.toLowerCase();
			marketsApi.getQuote(symbol, (quote) => {
				marketsApi.getDealingData(symbol, (dealingData) => {
					const percentSelling = selectedSentiment.percentageOfShorts;
					const percentBuying = selectedSentiment.percentageOfLongs;
					const price = parseFloat(quote[symbol].price);
					const change = parseFloat(quote[symbol].change.replace("%", ""));
					const displayName = dealingData[symbol].displayName;

					var payloads = [{
						topic: kafkaConfig.topicName,
						messages: [JSON.stringify(
							{
								"type": "trade-alert",
								"subtype": "sentiment",
								"data": {
									"symbol": symbol,
									"instrument": displayName,
									"currentPrice": price,
									"dailyChange": change,
									"percentSelling": percentSelling,
									"percentBuying": percentBuying
								}
							}
						)]
					}];

					producer.send(payloads, (err, data) => {
						if (err) {
							console.log(err);
							process.exit()
						}
						else {
							const insertMessage = `
								INSERT INTO trade_alerts (subtype, send_time, instrument)
								VALUES ('sentiment', NOW(), '${symbol}')`;
							ipmMysqlConnection.query(insertMessage, (err, rows) => {
								if (err) {
									console.log(err);
								}
								process.exit()
							})
						}
					});
				});
			});
		});
	});
});
