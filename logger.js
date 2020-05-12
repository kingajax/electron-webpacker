const winston = require("winston");

var transport = new winston.transports.Console({
  colorize: true,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
});

var opts = {
  level: "info",
  transports: [transport]
};

/*
 * expose our logger instance
 */
module.exports = winston.createLogger(opts);
