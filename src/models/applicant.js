const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getApplicantModel() {
  return getDbConnection().define(
    'Applicant',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      no: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        comment: '编号',
      },
      policyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '保单ID',
      },
      name: {
        type: DataTypes.STRING(32),
        allowNull: true,
        comment: '姓名',
      },
      idType: {
        type: DataTypes.ENUM(['idcard', 'passport']),
        allowNull: true,
        comment: '证件类型',
      },
      idNo: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '证件号码',
      },
      gender: {
        type: DataTypes.ENUM('man', 'female', 'other', 'unknown'),
        allowNull: true,
        comment: '性别',
      },
      birth: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '出生日期',
      },
      contactNo: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '联系号码',
      },
      email: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '电子邮箱地址',
      },
    },
    {
      comment: '投保人表',
    },
  );
};
