const evn = require('../libraries/env');
const { getDbConnection } = require('../libraries/data-access');
const { getProducerModel } = require('./index');

const sync = async () => {
  if (evn.isProd()) throw new Error('不允许生产环境执行！');

  // 定义模型
  getProducerModel();

  // 将模型同步到数据库（创建对应表）
  await getDbConnection().sync({
    // 如果已经存在对应表则先删除它
    force: true,
  });
};

sync()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('模型已强制同步到数据库');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
