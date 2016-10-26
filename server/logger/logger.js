/**
 * logger.js
 * 1. Initialize logging with the help of winston
 */


var winston = require('winston');
var fs = require('fs');
winston.emitErrs = true;


var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'silly',
            //filename: './log/imessage.log',
            stream: fs.createWriteStream('./log/imessage.log', {flags: 'a'}),
            handleExceptions: true,
            json: true,
            colorize: true
        }),
        new winston.transports.Console({
            level: 'error',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;

module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

/*
app.use(require('morgan')({ "stream": logger.stream }));
 */