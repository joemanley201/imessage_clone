# imessage_clone
Clone of iMessage Application
### Installation and launching
1. `npm init` to install the application.
2. Install the node_modules and the existing imessage.db has enough data to get started.
3. Once all the node_modules are installed, start the server by using, `node server.js` or `nodemon server.js`.
4. `nodemon` monitors the server for changes and restarts when needed.
5. NPM package `opener` launches the application in a new tab in your default browser.
6. If it doesn't happen, navigate to `http://localhost:5000/` on your browser to start the application or check for logs in the console.

### File structure
1. `config/` - Configuration.json to indicate host, ports, log levels, paths, etc.
2. `contact_images/` - Images of a few personalities which can be used as contact images. You can choose your own image as well.
3. `log` - Default folder for storing the log files. Logs are stored in JSON format
4. `public` - public files to be exposed to the client side
    * `css` - stylesheets
    * `images` - for default contacts, loading icon, favicon
    * `js` - AngularJS files for the application, controllers, services, etc.
    * `views` - Html fragments for login, registration and home page
5. `screenshots` - Some screenshots to give a good feel of the application
6. `server` - Contains all the server files
    * `data` - Has the db file for storing user information and messages
    * `db` - Has the db logic to fetch and manipulate information in the db
    * `global` - Global configurations or services can be added here to be available globally
    * `logger` - Has the logic for creating the logger and specifying the levels and path
    * `session` - Details about managing the session in the application
    * `util` - Util object to support library of utility methods
7. `server.js` - Node.js server entry point


### Registration
Even though there are existing users already (if you had downloaded the imessage.db file), you can create your own contact from the registration page.
![registration]
[registration]: screenshots/1_register.png

### Login
![login]
[login]: screenshots/2_login.png

### Home page - User
It looks empty without any conversations or messages. So let's send a message to someone in our contact list.

![home_page]
[home_page]: screenshots/3_landing_page.png


### New message
Select any one of the contacts to start sending messages to them.

![contacts_modal]
[contacts_modal]: screenshots/4_contacts_modal.png


### Send messages with images
You can send normal text messages as well as send images along with them.


![send_message_with_image]
[send_message_with_image]: screenshots/5_send_messages_with_image.png

### Receiving messages
The recipient gets notifications with the number of unread messages in their conversation list, while logged in or after logging in.

![recipient_home]
[recipient_home]: screenshots/6_micael_home_page.png

### Reading messages
The recipient can click on a contact to read the new messages. Once the contact is opened, notification is sent to the DB to clear the unread message flag for that conversation.

![recipient_unread]
[recipient_unread]: screenshots/7_chat_with_images_unread.png

### Replying to messages
The recipient can now reply to images and enjoy their conversation.

![recipient_reply]
[recipient_reply]: screenshots/8_more_conversation.png


### Features
- [x] **Search conversations, contacts**
- [x] **Conversations, messages sorted based on timestamp**
- [x] **Relative timestamps using Moment.js**
- [x] **Logging activities using Winston**
- [x] **Configurable settings**
- [ ] Encryption of passwords and messages
- [ ] Sending smileys by using Unicode characters
- [ ] Video calling using WebRTC
- [ ] Chatbot integrations
- [ ] Deletion of messages, conversation
- [ ] Preview of links in messages
- [ ] Analytics and insights from logs