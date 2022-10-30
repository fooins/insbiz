const { getJobModel } = require('../../src/models');

/**
 * 初始化数据
 */
const initDatas = async () => {
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

initDatas()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('初始化数据成功');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
