const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getSecretModel() {
  return getDbConnection().define(
    'Secret',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      secretId: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        comment: '密钥标识',
      },
      secretKey: {
        type: DataTypes.STRING(256),
        allowNull: false,
        comment: '密钥',
      },
      producerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '渠道ID',
      },
    },
    {
      comment: '密钥表',
    },
  );
};
