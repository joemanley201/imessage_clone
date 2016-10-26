/**
 * All the logic manipulating or fetching from the Database and returning JSON results.
 * db.js
 * @type {[type]}
 */

//Make this true to clear the data in database
var cleanUpServerOnRestart = false;

var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var db_file_name = './server/data/imessage.db';
var db;
try {
    fs.accessSync(db_file_name, fs.F_OK);
    db = new sqlite3.Database('./server/data/imessage.db');
    logger.info("Loaded db - server/data/imessage.db");
} catch (e) {
    logger.warn("DB File does not exist");
    db = new sqlite3.Database('./server/data/imessage.db');
    logger.info("Created db - server/data/imessage.db");
};

/*
Create and populate User Info
 */
db.serialize(function() {
    //Drop user_info table if it exists and create a new one
    if (cleanUpServerOnRestart) {
    	db.run("DROP TABLE IF EXISTS user_info");
    	db.run("CREATE TABLE IF NOT EXISTS user_info (user_id INTEGER PRIMARY KEY, username TEXT, password TEXT, first_name TEXT, last_name TEXT, image_data BLOB)");
    }



    /*
	//Load contacts from predefined user list
	var userList = require('../../config/userList.json');
    logger.info("[Contacts]", "Userlist loaded with", userList.length, "user(s)");
    var stmt = db.prepare("INSERT INTO user_info VALUES (NULL, ?, ?, ?, ?, ?)");
    for (var idx = 0; idx < userList.length; idx++) {
        var currentUser = userList[idx];
        stmt.run(currentUser.username, currentUser.password, currentUser.firstName, currentUser.lastName, currentUser.imageData || null);
    }
    stmt.finalize();
    */

});


/*
Create and populate Messages
 */

db.serialize(function() {
	//Drop messages table if it exists and create a new one
	if (cleanUpServerOnRestart) {
	    db.run("DROP TABLE IF EXISTS messages");
	    db.run("CREATE TABLE IF NOT EXISTS messages (message_id INTEGER PRIMARY KEY, from_user_id INTEGER, to_user_id INTEGER, message_text TEXT, timestamp INTEGER, message_image INTEGER, image_data BLOB, conversation_id TEXT, message_unread INTEGER)");
	}
});

module.exports = {
	//See if username and password matched and then return results based on that
    authenticateUser: function(userObject, callback) {
        db.serialize(function() {
        	var queryString = "SELECT user_id, first_name, last_name, image_data FROM user_info where username = '" + userObject.username + "' and password = '" + userObject.password + "'";
        	logger.info("[QUERY]", queryString);
            db.get(queryString, function(err, row) {
                var result = {};
                if (row && (row.user_id !== undefined)) {
                    result.success = true;
                    result.message = "Login Successful";
                    result.user_id = row.user_id;
                    result.fullName = row.first_name + " " + row.last_name;
                    result.imageData = row.image_data || 'images/contact.png';
                    logger.info("[LOGIN] SUCCESS", userObject.username);
                } else {
                    result.success = false;
                    result.message = "Login Failed"
                    logger.info("[LOGIN] FAILED", userObject.username);
                }
                callback(result);
            });
        });
    },

    //Create user while registration
    createUser: function(userObject, callback) {
        db.serialize(function() {
        	var queryString = "SELECT count(*) as count FROM user_info where username = '" + userObject.username + "'";
        	logger.info("[QUERY]", queryString);
            db.get(queryString, function(err, row) {
                var result = {};
                var rowCount = row.count;
                if (rowCount == 0) {
                    result.success = true;
                    var stmt = db.prepare("INSERT INTO user_info VALUES (NULL, ?, ?, ?, ?, ?)");
                    stmt.run(userObject.username, userObject.password, userObject.firstName, userObject.lastName, userObject.imageData);
                    stmt.finalize();
                    result.message = "Registration Successful";
                    logger.info("[ACCOUNT CREATION]", "SUCCESS", userObject.username);
                } else {
                    result.success = false;
                    result.message = "Username exists already";
                    logger.info("[ACCOUNT CREATION]", "FAILED", userObject.username, "exists already.");
                }
                callback(result);
            });
        });
    },

    //Get all registered contacts from user_info
    getContacts: function(userId, callback) {
        var result = [];
        db.serialize(function() {
        	var queryString = "SELECT first_name, last_name, username, user_id, image_data from user_info where user_id !=" + userId + " ORDER BY first_name";
        	logger.info("[QUERY]", queryString);
            db.each(queryString, function(err, row) {
                result.push({ fullName: row.first_name + " " + row.last_name, username: row.username, userId: row.user_id, imageData: row.image_data || 'images/contact.png'});
            }, function() {
                logger.info("[CONTACTS]", "Fetched for", userId);
                callback(result);
            });
            //callback(result);
        });
    },

    //Add message to DB
    addMessage: function(fromUserId, toUserId, messageText, timestamp, messageImage, imageBlob, messageUnread) {
        var conversation_id = [fromUserId, toUserId].sort(util.sortNumber).join("-");
        var stmt = db.prepare("INSERT INTO messages VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(fromUserId, toUserId, messageText, timestamp, messageImage, imageBlob, conversation_id, messageUnread);
        stmt.finalize();
        logger.info("[MESSAGE]", "Sent from", fromUserId, "to", toUserId);
    },

    //Fetch all conversations from the DB based on the current userId
    getAllConversations: function(userId, callback) {
        var result = [];
        db.serialize(function() {
        	var queryString = "SELECT a.first_name, a.last_name, a.image_data, b.message_text, b.timestamp, b.message_image, b.user_id, b.unread_message_count";
			queryString += " FROM user_info a JOIN (";
			queryString += "SELECT message_text, timestamp, message_image, image_data, REPLACE(REPLACE(conversation_id, '" + userId + "-', ''), '-" + userId + "', '') AS user_id,";
			queryString += " SUM(message_unread) as unread_message_count FROM messages";
			queryString += " WHERE from_user_id = " + userId + " OR to_user_id = " + userId + " GROUP BY conversation_id ORDER BY timestamp desc) b ON a.user_id = b.user_id;";
			logger.info("[QUERY]", queryString);
            db.each(queryString, function(err, row) {
                var record = {};
                record.fullName = row.first_name + " " + row.last_name;
                record.imageData = row.image_data;
                if (row.message_image) {
                    record.messageText = "Image";
                } else {
                    record.messageText = row.message_text;
                }
                record.imageData = row.image_data || 'images/contact.png';
                record.timestamp = row.timestamp;
                record.userId = parseInt(row.user_id);
                record.unreadMessageCount = row.unread_message_count;
                result.push(record);
            }, function() {
                logger.info("[CONVERSATIONS]", "Fetched -", userId);
                callback(result);
            });
        });
    },

    //Get all messages for conversation with userId and otherUserId
    getConversation: function(userId, otherUserId, callback) {
        var result = [];
        var conversation_id = [userId, otherUserId].sort(util.sortNumber).join("-");
        db.serialize(function() {
        	var queryString = "SELECT from_user_id, to_user_id, message_text, timestamp, message_image, image_data FROM messages WHERE conversation_id='" + conversation_id + "';"
        	logger.info("[QUERY]", queryString);
            db.each(queryString, function(err, row) {
                result.push({
                    from: row.from_user_id,
                    to: row.to_user_id,
                    text: row.message_text,
                    timestamp: row.timestamp,
                    image: row.message_image,
                    blobURL: row.image_data
                });
            }, function() {
                logger.info("[CONVERSATIONS]", "Fetched for", otherUserId, "-", userId);
                callback(result);
            })
        });
    },

    //Mark conversation as read
    readConversation: function(fromUserId, toUserId) {
    	var conversation_id = [fromUserId, toUserId].sort(util.sortNumber).join("-");
    	db.serialize(function() {
    		var queryString = "UPDATE messages set message_unread = 0 where conversation_id ='" + conversation_id + "'";
    		logger.info("[QUERY]", queryString);
    		db.run(queryString);
    	});
    }
};
