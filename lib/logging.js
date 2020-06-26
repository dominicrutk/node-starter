'use strict';

const fs = require('fs-extra');
const log4js = require('log4js');
const path = require('path');

let configured = false;
let logger;

const configure = () => {
  let loggingConfig = {
    appenders: {
      console: {
        type: 'console'
      }
    },
    categories: {
      default: {
        appenders: ['console'],
        level: process.env.LOG_LEVEL || 'info'
      }
    }
  };
  if (process.env.LOG_DIR) {
    let logPath = path.isAbsolute(process.env.LOG_DIR) ? process.env.LOG_DIR : path.join(process.env.APP_ROOT, process.env.LOG_DIR);
    try {
      fs.ensureDirSync(logPath);
      loggingConfig.appenders.file = {
        type: 'file',
        filename: path.join(logPath, 'log.log'),
        maxLogSize: Number(process.env.LOG_MAX_BYTES) || (10 * 1024 * 1024),
        backups: Number(process.env.LOG_BACKUPS) || 10,
        compress: true,
        keepFileExt: true
      };
      loggingConfig.categories.default.appenders.push('file');
    } catch (err) {
      if (err === 'EACCES') {
        throw new Error(`Permissions error trying to access the logs directory ${logPath}`);
      } else {
        throw new Error(`Unknown error trying to access the logs directory ${logPath}: ${err.message}`);
      }
    }
  }
  log4js.configure(loggingConfig);

  logger = log4js.getLogger('logging meta');
  logger.info('log4js configured');

  configured = true;
};

module.exports = {
  getLogger: (name = 'default') => {
    if (!configured) {
      configure();
    }
    return log4js.getLogger(name);
  }
};
