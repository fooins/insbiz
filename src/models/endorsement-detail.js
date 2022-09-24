const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getEndorsementDetailModel() {
  return getDbConnection().define(
    'EndorsementDetail',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      endorsementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '批单ID',
      },
      type: {
        type: DataTypes.ENUM('policy', 'applicant', 'insured'),
        allowNull: false,
        comment: '批改类型',
      },
      field: {
        type: DataTypes.STRING(32),
        allowNull: false,
        comment: '批改的字段名',
      },
      original: {
        type: DataTypes.STRING(128),
        allowNull: false,
        comment: '原值（批改前）',
      },
      current: {
        type: DataTypes.STRING(128),
        allowNull: false,
        comment: '当前值（批改后）',
      },
      targetNo: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '批改目标编号。投保人或被保险人编号。',
      },
    },
    {
      comment: '批单详情表',
      tableName: 'endorsement_details',
    },
  );
};
