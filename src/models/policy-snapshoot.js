const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getPolicySnapshootModel() {
  return getDbConnection().define(
    'PolicySnapshoot',
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
      endorsementId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '批单ID',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '快照内容(JSON)',
      },
    },
    {
      comment: '保单快照表',
      tableName: 'policy_snapshoots',
    },
  );
};
