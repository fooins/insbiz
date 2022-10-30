const syncModels = require('../../src/models/sync');

/**
 * 创建表
 */
const createTables = async () => {
  await syncModels({ force: true });
};

createTables()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('创建表成功');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
