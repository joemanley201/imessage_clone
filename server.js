//Global
require('./server/global/global.js');


//Includes
var express = require('express');
var http = require('http');
var db = require('./server/db/db.js');
var bodyParser = require('body-parser');
var opener = require('opener');


//Create app
var app = express();

//Create server and listen to it
var server = http.createServer(app);
io = require('socket.io').listen(server);
server.listen(config.PORT);
logger.info("Server listening on port " + config.PORT);

//Initialize set of loggedInUsers
var loggedInUsers = {};


//Initialize path variables for public and other packages
app.use(express.static(__dirname + '/public'));

app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/angular', express.static(__dirname + '/node_modules/angular/'));
app.use('/angular-route', express.static(__dirname + '/node_modules/angular-route/'));
app.use('/angular-cookies', express.static(__dirname + '/node_modules/angular-cookies/'));
app.use('/font-awesome', express.static(__dirname + '/node_modules/font-awesome/'));
app.use('/moment', express.static(__dirname + '/node_modules/moment/min/'));


//Create JSON parser to read from request
var jsonParser = bodyParser.json();

//API Handlers
//Return Index.html
app.get('/', function(req, res) {
	res.sendFile(__dirname + "/public/" + "index.html");
});

/**
 * API Handler to authenticate the username, password of the user while logging in
 * @param  {[type]} req  [login request with username and password]
 * @return {[type]}      [result user object with fullName, userId, contactPicture]
 */
app.post('/api/authenticate', jsonParser, function(req, res) {
	db.authenticateUser(req.body, function(result) {
		res.send(result);
	});
});

/**
 * API Handler to create a new user on registration
 * Fails if a username already exists
 * @param  {[type]} req  [Registration details - firstName, lastName, username, password, contactPicture]
 * @return {[type]}      [result object with flag indicating success or failure]
 */
app.post('/api/create', jsonParser, function(req, res) {
	db.createUser(req.body, function(result) {
		res.send(result);
	});
});

/**
 * API Handler to return all the users in the user_info table
 * @param  {[type]} req  [userId requesting for the call]
 * @return {[type]}      [Return array of contact objects with details]
 */
app.post('/api/contacts', jsonParser, function(req, res) {
	db.getContacts(req.body.userId, function(result) {
		res.send(result);
	});
});

/**
 * API Handler to return all the conversations for the selected user
 * @param  {[type]} req  [userId requesting for the call]
 * @return {[type]}      [Return array of conversation objects - having latest message, timestamp]
 */
app.post('/api/allConversations', jsonParser, function(req, res) {
	db.getAllConversations(req.body.userId, function(result) {
		res.send(result);
	});
});

/**
 * API Handler to return the messages for a particular conversation
 * @param  {[type]} req  [userId requesting and the userId of the conversation]
 * @return {[type]}      [Return array of messages for the requested conversation]
 */
app.post('/api/conversation', jsonParser, function(req, res) {
	db.getConversation(req.body.userId, req.body.otherUserId, function(result) {
		res.send(result);
	});
});



io.sockets.on('connection', function (socket) { // First connection
	//Socket to handle and log, login of user
	socket.on('login', function(userId) {
		socket.userId = userId;
		socket.loggedIn = true;
		logger.info("[CONNECTED] userId", userId);
		loggedInUsers[userId] = socket.id;
	});

	//Socket to handle and log, logout of user
	socket.on('logout', function(userId) {
		logger.info("[LOGOUT] userId", userId);
	});

	//Socket to handle messages being sent
	socket.on('messageSent', function(message) {
		db.addMessage(message.from, message.to, message.text, message.timestamp, message.image, message.blobURL || '', message.unread || 0);
		if (loggedInUsers[message.to]) {
			io.to(loggedInUsers[message.to]).emit('messageReceived', message);
		}
	});

	//Socket to update the conversations to be read
	socket.on('conversationRead', function(conversation) {
		db.readConversation(conversation.from, conversation.to);
	});

	//Socket to update the connection termination
	socket.on('disconnect', function () { // Disconnection of the client
		if (socket.id && socket.loggedIn) {
			socket.loggedIn = false;
			logger.info("[DISCONNECTED] userId", socket.id);
		}
		delete loggedInUsers[socket.userId];
	});
});

//Uncomment to enable opening window
//opener('http://localhost:' + config.PORT);