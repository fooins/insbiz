const config = require('config');
const { Sequelize } = require('sequelize');
const logger = require('./logger')('data-access', { noConsole: true });

// ️️️在进程中保留一个单例 DB 连接池
let dbConnection;

/**
 * 获取数据库连接
 * @returns {Sequelize} Sequelize 实例
 */
const getDbConnection = () => {
  if (!dbConnection) {
    dbConnection = new Sequelize({
      host: config.get('db.host'),
      port: config.get('db.port'),
      username: config.get('db.username'),
      password: config.get('db.password'),
      database: config.get('db.database'),
      dialect: 'mysql',
      logging: (msg) => logger.info(msg),
    });
  }

  return dbConnection;
};

module.exports = {
  getDbConnection,
};
