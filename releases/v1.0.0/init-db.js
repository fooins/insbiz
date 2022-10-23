const config = require('config');
const { Sequelize } = require('sequelize');
const { getJobModel } = require('../../src/models');
const syncModels = require('../../src/models/sync');
const logger = require('../../src/libraries/logger')('data-access', {
  noConsole: true,
});

/**
 * 初始化数据库
 */
const initDB = async () => {
  // 创建数据库连接（用于创建数据库）
  const dbConnection = new Sequelize({
    host: config.get('db.host'),
    port: config.get('db.port'),
    username: config.get('db.username'),
    password: config.get('db.password'),
    dialect: 'mysql',
    logging: (msg) => logger.info(msg),
    timezone: '+08:00',
  });

  // 创建数据库
  await dbConnection.query('CREATE DATABASE `insbiz`');

  // 同步模型
  await syncModels();

  // 创建初始数据：作业
  await getJobModel().bulkCreate([
    {
      name: 'autoCompensate',
      description: '执行自动赔付',
      status: 'enable',
      script: 'autoCompensate',
      cron: '*/10 * * * * *',
    },
    {
      name: 'notifier',
      description: '执行通知',
      status: 'enable',
      script: 'notifier',
      cron: '*/5 * * * * *',
    },
  ]);
};

initDB()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('初始化数据库成功');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
