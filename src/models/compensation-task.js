const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getCompensationTaskModel() {
  return getDbConnection().define(
    'CompensationTask',
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
      status: {
        type: DataTypes.ENUM('pending', 'handing', 'succeed', 'failure'),
        defaultValue: 'pending',
        allowNull: false,
        comment: '状态',
      },
      handledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '开始处理时间',
      },
      finishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '处理完成时间',
      },
      failureReasons: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '失败原因',
      },
      autoCompensate: {
        type: DataTypes.ENUM('enabled', 'disabled'),
        defaultValue: 'disabled',
        allowNull: false,
        comment: '是否自动赔付',
      },
    },
    {
      comment: '赔付任务表',
      tableName: 'compensation_tasks',
    },
  );
};
