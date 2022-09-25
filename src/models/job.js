const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getJobModel() {
  return getDbConnection().define(
    'Job',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      name: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        comment: '名称',
      },
      description: {
        type: DataTypes.STRING(256),
        allowNull: true,
        comment: '描述',
      },
      status: {
        type: DataTypes.ENUM('enable', 'disabled', 'error'),
        defaultValue: 'disabled',
        allowNull: false,
        comment: '状态',
      },
      script: {
        type: DataTypes.STRING(32),
        allowNull: false,
        comment: '执行的脚本',
      },
      cron: {
        type: DataTypes.STRING(32),
        allowNull: false,
        comment: 'Cron格式',
      },
    },
    {
      comment: '作业表',
    },
  );
};
