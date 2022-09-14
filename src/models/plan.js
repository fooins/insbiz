const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getPlanModel() {
  return getDbConnection().define(
    'Plan',
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
        comment: '计划名称',
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: 'uni_code_version',
        comment: '计划代码',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uni_code_version',
        comment: '计划版本（同产品版本）',
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '所属产品ID',
      },
      bizConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '业务规则配置(JSON格式)',
      },
    },
    {
      comment: '保险产品计划表',
    },
  );
};
