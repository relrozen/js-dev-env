import $j from "jquery";
import io from "socket.io-client";

var MessagingService = (function() { // eslint-disable-line no-unused-vars

	const MESSAGE_TYPE_NAME = 'MESSAGE_TO_CLIENT';
	const OPT_OUT = 'OPT_OUT';
	const OPT_OUT_DAYS_OPTIONS = {
		'1': 1,
		'2': 7,
		'3': 30,
		'4': 60
	};

	var _cId = "",
		_language = "",
		_isReal,
		_socket = null,
		_token = null,
		_actionHandlers;

	function init(options) {
		_cId = options.cId;
		_language = options.language;
		_isReal = options.isReal;
		_token = options.token;
		_actionHandlers = options.actionHandlers;
		_socket = io.connect(getSocketUrl(), { // TODO replace url with real one
			query: "cId=" + _cId + "&lang=" + _language + "&isreal=" + _isReal + "&token=" + _token,
			secure: true
		});
		_socket.on(MESSAGE_TYPE_NAME, function(msg) {
			var node = document.createElement('style');
			document.body.appendChild(node);
			node.innerHTML = msg.css;
			$j('body').append(msg.html);
			$j('.ipm-alert-wrapper').fadeIn(1000);
			
			$j('.ipm-close').click(function() {
				$j('.ipm-alert-wrapper').fadeOut(500, function() {
					$j('.ipm-alert-wrapper').remove();
					document.body.removeChild(node);
				});
			});

			$j('.ipm-info').click(function() {
				$j('.ipm-alert').fadeOut();
				$j('.ipm-whats-this-wrapper').fadeIn();
			});

			$j('.ipm-settings').click(function() {
				$j('.ipm-alert').fadeOut();
				$j('.ipm-settings-wrapper').fadeIn();
			});

			$j('.ipm-what-this-got-it').click(function() {
				$j('.ipm-alert').fadeIn();
				$j('.ipm-whats-this-wrapper').fadeOut();
			});

			$j('.ipm-save-settings').click(function() {
				$j('.ipm-alert').fadeIn();
				$j('.ipm-settings-wrapper').fadeOut();
				saveSettings(msg.alertType);
			});

			$j('.ipm-cancel-settings').click(function() {
				$j('.ipm-alert').fadeIn();
				$j('.ipm-settings-wrapper').fadeOut();
			});
			
			$j('.ipm-what-this-text span').click(function() {
				$j('.ipm-settings-wrapper').fadeIn();
				$j('.ipm-whats-this-wrapper').fadeOut();
			})
			
			if ($j('.ipm-btn-1').length > 0) {
				$j('.ipm-btn-1').click(function() {
					_actionHandlers[msg.actions[0].action].apply(null, msg.actions[0].args);
					$j('.ipm-alert-wrapper').fadeOut(500, function() {
						$j('.ipm-alert-wrapper').remove();
						document.body.removeChild(node);
					});
				})
			}
		});
	}

	function saveSettings(alertType) {
		var val = $j('input[name=ipm-opt-out]:checked').val();
		if (val) {
			_socket.emit(OPT_OUT, {
				'cId': _cId,
				'days': OPT_OUT_DAYS_OPTIONS[val],
				'alertType': alertType
			});
		}
	}

	function getSocketUrl() {
		if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
			return "http://localhost:8080"
		}
		else {
			return "https://pm-qa.markets.com"
		}
	}

	return {
		init: init
	}

}());

export {MessagingService};



