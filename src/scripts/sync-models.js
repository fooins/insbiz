const syncModels = require('../models/sync');

syncModels({ alter: true })
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('所有模型已同步到数据库（不会删除数据）');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
