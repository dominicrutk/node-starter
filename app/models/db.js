'use strict';

// Load dependencies
const logging = require('../../lib/logging');
const Sequelize = require('sequelize');

// Initialize logger
const logger = logging.getLogger('database');

// Store database models
let db = {};

module.exports = {
  init: () => {
    let sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialectOptions: {
        timezone: 'Etc/GMT+5'
      },
      logging: false
    });

    logger.info('Importing database models');

    db.User = sequelize.import('./User');
    logger.debug('Imported User model');

    db.RefreshToken = sequelize.import('./RefreshToken');
    logger.debug('Imported RefreshToken model');

    logger.info('Finished importing database models');

    logger.info('Attempting to synchronize database models');
    return sequelize.sync().then(() => {
      logger.info('Database models synchronized successfully');
      db.sequelize = sequelize;
      db.Sequelize = Sequelize;
      logger.info('Database initialization complete');
      return db;
    }).catch(error => {
      logger.error(`Database initialization failed: ${error}`);
      return Promise.reject();
    });
  },

  getModels: () => {
    if (!db.sequelize) {
      logger.error('The database has not yet been initialized; it must be initialized prior to getting its models');
      throw new Error('The database has not yet been initialized; it must be initialized prior to getting its models');
    }
    return db;
  }
};
