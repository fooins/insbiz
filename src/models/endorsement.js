const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getEndorsementModel() {
  return getDbConnection().define(
    'Endorsement',
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
        unique: 'uni_policy_endorse',
        comment: '保单ID',
      },
      endorseNo: {
        type: DataTypes.STRING(5),
        allowNull: false,
        unique: 'uni_policy_endorse',
        comment: '批单号',
      },
      difference: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: '保费变化差额',
      },
    },
    {
      comment: '批单表',
    },
  );
};
