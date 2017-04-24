import './example.css';
import $ from 'jquery';
import {MessagingService} from './index'

var testUsers = [
	{
		cId: "ariel",
		language: 'en',
		isReal: true,
		token: "780745dcbfe88266d12a453c0186d62d"
	},
	{
		cId: "ofir",
		language: 'en',
		isReal: true,
		token: "033edfbd3f236d602419b9e777167ad9"
	},
	{
		cId: "nadav",
		language: 'en',
		isReal: true,
		token: "f320af6ae6ec4af11a90c80882df854d"
	},
	{
		cId: "shay",
		language: 'en',
		isReal: true,
		token: "977dd8e29901b11108ba91d0cbcb9f71"
	},
	{
		cId: "zvi",
		language: 'en',
		isReal: true,
		token: "225b5e9c5b9fe9c706b542ea961f9885"
	},
	{
		cId: "erez",
		language: 'en',
		isReal: true,
		token: "fd662fa6538cbdbc3332c63984fa304f"
	},
	{
		cId: "ariel",
		language: 'en',
		isReal: false,
		token: "780745dcbfe88266d12a453c0186d62d"
	},
	{
		cId: "ofir",
		language: 'en',
		isReal: false,
		token: "033edfbd3f236d602419b9e777167ad9"
	},
	{
		cId: "nadav",
		language: 'en',
		isReal: false,
		token: "f320af6ae6ec4af11a90c80882df854d"
	},
	{
		cId: "shay",
		language: 'en',
		isReal: false,
		token: "977dd8e29901b11108ba91d0cbcb9f71"
	},
	{
		cId: "zvi",
		language: 'en',
		isReal: false,
		token: "225b5e9c5b9fe9c706b542ea961f9885"
	},
	{
		cId: "erez",
		language: 'en',
		isReal: false,
		token: "fd662fa6538cbdbc3332c63984fa304f"
	}
];

$(function() {
	testUsers.forEach(function(user, index) {
		$('tbody').append(`
			<tr>
				<td>${user.cId}</td>
				<!--<td>${user.token}</td>-->
				<td>${user.isReal ? "Real" : "Demo"}</td>
				<td>${user.language}</td>
				<td><button href="#" data-id="${index}" class="connect-user">connect</button></td>
			</tr>
		`)
	});

	$('.connect-user').click(function(event) {
		var id = $(event.target).attr("data-id");
		var userData = testUsers[id];
		userData.actionHandlers = {
			openRegistrationDialog: function () {
				alert("Opening registration dialog");
			},
			openDepositDialog: function () {
				alert("Opening deposit dialog");
			},
			openVerificationCenter: function () {
				alert("Opening verification center");
			},
			openTradeDialog: function (instrument, action) {
				alert("Opening trade screen for " +  instrument + " " + action);
			},
			openInstrumentPage: function(instrument) {
				alert("Opening instrument page for " + instrument);
			},
			switchToReal: function () {
				alert("Switching to real");
			}
		};
		MessagingService.init(userData);

	})
});

