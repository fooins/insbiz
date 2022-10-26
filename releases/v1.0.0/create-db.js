const config = require('config');
const { Sequelize } = require('sequelize');
const logger = require('../../src/libraries/logger')('data-access', {
  noConsole: true,
});

/**
 * 创建数据库
 */
const createDB = async () => {
  // 数据库连接
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
};

createDB()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('创建数据库成功');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
