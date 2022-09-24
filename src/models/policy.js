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
      policyNo: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: '保单号',
      },
      endorseNo: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '000',
        comment: '批单号',
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
      effectiveTime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '保单生效时间',
      },
      expiryTime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '保单终止时间',
      },
      boundTime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '承保时间',
      },
      premium: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: '总保费',
      },
      status: {
        type: DataTypes.ENUM('valid', 'canceled'),
        defaultValue: 'valid',
        allowNull: false,
        comment: '状态',
      },
    },
    {
      comment: '保单表',
      tableName: 'policies',
    },
  );
};
