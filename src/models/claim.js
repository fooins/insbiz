const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getClaimModel() {
  return getDbConnection().define(
    'Claim',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      policyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '保单ID',
      },
      claimNo: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: '理赔单号',
      },
      producerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '所属渠道ID',
      },
      sumInsured: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: '总保额',
      },
      status: {
        type: DataTypes.ENUM('pending', 'declined', 'paying', 'paid'),
        defaultValue: 'pending',
        allowNull: false,
        comment: '状态',
      },
      bizConfig: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '业务规则配置(JSON格式)',
      },
    },
    {
      comment: '理赔单表',
    },
  );
};
