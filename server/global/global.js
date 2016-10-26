/**
 * Placeholder for global variables
 */

//Read config from config file
global.config;
config = require('../../config/configuration.json');

//Create logger instance
global.logger;
logger = require('../../server/logger/logger.js');

//Include utility method
global.util;
util = require('../../server/util/util.js');