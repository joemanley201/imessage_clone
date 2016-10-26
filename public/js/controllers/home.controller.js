(function() {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController);


    HomeController.$inject = ['UserService', '$rootScope', '$scope', '$timeout'];

    function HomeController(UserService, $rootScope, $scope, $timeout) {
        var vm = this;
        vm.user = null;
        vm.allUsers = [];

        (function initController() {
            //Flag to indicate styling of home page
            $rootScope.dynamicPageClass = "home";
            //Listen to socket event - messageReceived and handle it
            $rootScope.socket.on('messageReceived', function(message) {
                $scope.addMessageToConversation(message, false);
            });

            //When no conversation is selected, show a landing div
            $scope.showLandingDiv = true;

            //Array to store contacts, conversations and loggedInUsers
            $scope.contacts = [];
            $scope.conversations = [];
            $scope.loggedInUsers = [];

            //Map to store messages 
            $scope.messages = {};

            $scope.selectedContact = null;
            $scope.currentUserId = $rootScope.globals.currentUser.userId;
            $scope.currentUserFullName = $rootScope.globals.currentUser.fullName;
            loadContacts();
            loadConversations();
        })();

        //Scroll the conversationDiv to bottom
        $scope.scrollConversationDivToBottom = function() {
            $timeout(function() {
                var element = angular.element("#conversationDiv");
                element.scope().$apply();
                if (element && element[0]) {
                    $("#conversationDiv").animate({
                        scrollTop: element[0].scrollHeight
                    });
                }
            }, 250);
        }

        //Selecting the contact in the contact list
        $scope.selectContact = function(userObject) {
            $scope.selectedContact = userObject;
            $scope.showLandingDiv = false;
            $scope.showLoadingDiv = true;
            userObject.unreadMessageCount = 0;
            loadConversationForUser(userObject.userId);
            $rootScope.socket.emit('conversationRead', { from: $scope.selectedContact.userId, to: $scope.currentUserId });
            $scope.scrollConversationDivToBottom();
            var element = $("#conversation_" + userObject.userId);
            if (element && element.length) {
                $('#contactsListDiv').animate({
                    scrollTop: $("#conversation_" + userObject.userId).offset().top - 50
                });
            }
        }

        //Send message on click of Send button
        $scope.sendMessage = function() {
            var messageText = $scope.messageText;

            //Do this only if something is entered into the field
            if (messageText.trim()) {
                var message = {};
                message.timestamp = new Date().getTime();
                message.from = $scope.currentUserId;
                message.fromName = $scope.currentUserFullName;
                message.to = $scope.selectedContact.userId;
                message.text = messageText;
                message.image = false;
                message.blobURL = null;
                message.unread = 1;
                $scope.addMessageToConversation(message, true);
                $scope.messageText = "";
            }
        }

        //Check if the current conversation is present in the global conversation map
        $scope.getConversationForUserId = function(userId) {
            return $scope.conversations.filter(function(conversation) {
                return conversation.userId == userId;
            });
        }

        //Add message to conversation, if message is being sent, send it to socket
        $scope.addMessageToConversation = function(message, messageSent) {
            //Update conversation pane with latest message and timestamp
            var userIdToCheck = messageSent ? message.to : message.from;
            var conversationForUserID = $scope.getConversationForUserId(userIdToCheck)[0];

            //If conversation exists, update text and timestamp. If not create contact and add to conversations array
            if (conversationForUserID) {
                conversationForUserID.messageText = message.text;
                conversationForUserID.timestamp = message.timestamp;
                //If the conversation is open, do not update unreadMessageCount
                if ($scope.selectedContact && (conversationForUserID.userId != $scope.selectedContact.userId)) {
                    conversationForUserID.unreadMessageCount += message.unread;
                }
                delete conversationForUserID.newMessage;
            } else {
                $scope.addContactToConversation({ messageText: message.text, timestamp: message.timestamp, fullName: message.fromName, userId: message.from, unreadMessage: message.unread }, false, false, true);
            }

            //If message is being sent, emit socket event
            if (messageSent) {
                if (!$scope.messages[message.to]) {
                    $scope.messages[message.to] = [];
                }
                $scope.messages[message.to].push(message);
                $rootScope.socket.emit('messageSent', message);
            } else {
                if (!$scope.messages[message.from]) {
                    $scope.messages[message.from] = [];
                }
                $scope.messages[message.from].push(message);
            }

            //Scroll the conversationDiv to bottom to show the latest message
            $scope.scrollConversationDivToBottom();
        }

        //Show image selection dialog box to add image
        $scope.addImage = function() {
            $("#imageUpload").click();
        }

        /*
        Once image is selected we need to fetch the particular image file and then extract Base64 format of the image.
        This enables us to store image in BLOB format
         */
        $scope.imageSelected = function(image) {
            $scope.uploadedImage = null;
            var reader = new FileReader();
            reader.onload = function(e) {
                $("#uploadImageModalImgDiv").attr('src', e.target.result);
                $scope.uploadedImage = e.target.result;
            }
            reader.readAsDataURL(image[0]);
            angular.element("#imageUpload").val(null);
            $("#uploadImageModal").modal('show');
        }

        //Handle sending text along with images separately
        $scope.sendMessageWithImage = function() {
            var message = {};
            message.timestamp = new Date().getTime();
            message.from = $scope.currentUserId;
            message.fromName = $scope.currentUserFullName;
            message.to = $scope.selectedContact.userId;
            message.text = $scope.messageTextWithImage;
            message.image = true;
            message.unread = 1;
            message.blobURL = $scope.uploadedImage;
            $scope.messageTextWithImage = "";
            $scope.addMessageToConversation(message, true);
            $("#uploadImageModal").modal('hide');
        }

        //Update image to be shown as a preview in the modal
        $scope.showImageModal = function(message) {
            $("#showImageModalImgDiv").attr('src', message.blobURL);
            $("#showImageModal").modal('show');
            $("#showImageModalMessageText").html(message.text);
        }

        //Create a new message by selecting any contact from the list of contacts
        $scope.newMessage = function() {
            //Refersh contacts
            loadContacts();

            $("#showContactsModal").modal('show');
            $scope.searchContactText = "";
        }

        //Add contact to the existing conversation array. This can be the case when we are creating a new message by clicking on New Message
        $scope.addContactToConversation = function(contact, selectContact, newMessage) {
            $scope.searchConversationText = "";
            $("#showContactsModal").modal('hide');
            //check if contact has conversation already, if not create a conversation
            var conversationForUserID = $scope.getConversationForUserId(contact.userId);
            if (!conversationForUserID.length) {
                //add contact to conversation
                var conversation = {
                    newMessage: newMessage,
                    unreadMessageCount: contact.unreadMessage,
                    messageText: contact.messageText || "",
                    fullName: contact.fullName,
                    userId: contact.userId,
                    timestamp: new Date().getTime(),
                    imageData: contact.imageData
                };
                $scope.conversations.push(conversation);
            }
            if (selectContact) {
                $scope.selectContact(contact);
            }
        }

        /*
            PRIVATE METHODS
         */
        //Load list of contacts
        function loadContacts() {
            UserService.GetContacts({
                    userId: $rootScope.globals.currentUser.userId
                })
                .then(function(users) {
                    $scope.contacts = users;
                });
        }

        //Load list of conversations
        function loadConversations() {
            UserService.GetAllConversationsForUser({
                    userId: $rootScope.globals.currentUser.userId
                })
                .then(function(conversations) {
                    $scope.conversations = conversations;
                });
        }

        //Load conversation for user by fetching all messages for all the userId
        function loadConversationForUser(userId) {
            UserService.GetConversationForUser({
                    otherUserId: userId,
                    userId: $rootScope.globals.currentUser.userId
                })
                .then(function(messages) {
                    $scope.messages[userId] = messages;
                    $scope.showLoadingDiv = false;
                });
        }

        //Utility method using moment.js to manipulate timestamps and transform as necessary
        $scope.getDateTimeFromTimestamp = function(timestamp, includeTime) {
            var timestampMoment = moment(new Date(timestamp));
            var nowMoment = moment(new Date());
            var resultArray = [];

            if (nowMoment.diff(timestampMoment, 'days') == 0) {
                return timestampMoment.format("HH:mm");
            } else if (nowMoment.diff(timestampMoment, 'days') == 1) {
                resultArray.push("Yesterday");
            } else if (nowMoment.diff(timestampMoment, 'days') <= 5) {
                resultArray.push(timestampMoment.format("dddd"));
            } else {
                resultArray.push(timestampMoment.format("MM/DD/YYYY"));
            }
            if (includeTime) {
                resultArray.push(timestampMoment.format("HH:mm"));
            }
            return resultArray.join(" ");
        }
    }

})();
