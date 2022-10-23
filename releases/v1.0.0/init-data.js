const { getJobModel } = require('../../src/models');

/**
 * 添加初始数据
 */
const initData = async () => {
  // 创建作业
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

initData()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('添加初始数据成功');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
