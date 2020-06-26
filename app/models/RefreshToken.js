'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RefreshToken', {
    userId: {
      type: DataTypes.BIGINT(11),
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
