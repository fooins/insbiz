const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getContractModel() {
  return getDbConnection().define(
    'Contract',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: 'uni_code_version',
        comment: '契约代码',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uni_code_version',
        comment: '契约版本',
      },
      producerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '所属渠道ID',
      },
      bizConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '业务规则配置(JSON格式)',
      },
    },
    {
      comment: '契约表',
    },
  );
};
