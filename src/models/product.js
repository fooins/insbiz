const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getProductModel() {
  return getDbConnection().define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '产品名称',
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: 'uni_code_version',
        comment: '产品代码',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uni_code_version',
        comment: '产品版本',
      },
      bizConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '业务规则配置(JSON格式)',
      },
    },
    {
      comment: '保险产品表',
    },
  );
};
