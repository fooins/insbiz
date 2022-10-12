const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getNotifyTaskModel() {
  return getDbConnection().define(
    'NotifyTask',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'handing',
          'succeed',
          'retry',
          'failure',
        ),
        defaultValue: 'pending',
        allowNull: false,
        comment: '状态',
      },
      type: {
        type: DataTypes.ENUM('ClaimStatusChange'),
        allowNull: false,
        comment: '类型',
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '任务相关数据(JSON格式)',
      },
      producerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '所属渠道ID',
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
      retries: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: '重试次数',
      },
      retryAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '下次重试的时间',
      },
    },
    {
      comment: '通知任务表',
      tableName: 'notify_tasks',
    },
  );
};
