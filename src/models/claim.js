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
      sumInsured: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: '总保额',
      },
      status: {
        type: DataTypes.ENUM('pending', 'handing', 'declined', 'confirmed'),
        defaultValue: 'pending',
        allowNull: false,
        comment: '状态',
      },
    },
    {
      comment: '理赔单表',
    },
  );
};
