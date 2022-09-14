const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getPolicyModel() {
  return getDbConnection().define(
    'Policy',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      orderNo: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: 'uni_order_no_producer',
        comment: '订单号',
      },
      producerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'uni_order_no_producer',
        comment: '所属渠道ID',
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '所属契约ID',
      },
      contractVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '所属契约版本',
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '关联产品ID',
      },
      productVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '关联产品版本号',
      },
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '关联计划ID',
      },
      bizConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '业务规则配置(JSON格式)',
      },
    },
    {
      comment: '保单表',
      tableName: 'policies',
    },
  );
};
