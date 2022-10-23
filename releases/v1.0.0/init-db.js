const { getJobModel } = require('../../src/models');
const { getDbConnection } = require('../../src/libraries/data-access');
const syncModels = require('../../src/models/sync');

/**
 * 初始化数据库
 */
const initDB = async () => {
  // 创建数据库
  await getDbConnection().query('CREATE DATABASE `insbiz`;');

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
