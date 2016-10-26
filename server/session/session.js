/**
 * Manage sessions for each login
 */

var session = require('client-sessions');

module.exports = session({
  cookieName: 'session',
  secret: 'session_secret',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
});