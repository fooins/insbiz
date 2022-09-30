const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getClaimInsuredModel() {
  return getDbConnection().define(
    'ClaimInsured',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      claimId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '理赔单ID',
      },
      no: {
        type: DataTypes.STRING(36),
        allowNull: false,
        comment: '编号',
      },
      sumInsured: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: '保额',
      },
    },
    {
      comment: '理赔单被保险人表',
      tableName: 'claim_insureds',
    },
  );
};
