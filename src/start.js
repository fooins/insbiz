const winston = require('winston');
const config = require('config');
const { startHttpServer } = require('./server');
const { scheduleJob } = require('./scheduler');
const { validateConfigs } = require('./libraries/configuration');
const { getDbConnection } = require('./libraries/data-access');
const { getRedis } = require('./libraries/redis');
const {
  handleError,
  AppError,
  ErrorCodes,
} = require('./libraries/error-handling');

// 创建日志记录器
const logger = require('./libraries/logger')('start', {
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp}|${process.pid}|${info.message}`,
    ),
  ),
});

(async () => {
  try {
    validateConfigs();
    logger.info('所有配置校验通过');

    await getDbConnection().authenticate();
    logger.info('数据库连接成功');

    await new Promise((resolve) => {
      getRedis().on('connect', () => {
        logger.info('Redis连接成功');
        resolve();
      });
    });

    const addressInfo = await startHttpServer();
    logger.info('HTTP服务启动成功', { addressInfo });

    if (config.get('scheduleJob')) {
      await scheduleJob();
      logger.info('作业调度成功');
    }
  } catch (error) {
    handleError(
      new AppError(error.message, {
        code: ErrorCodes.InternalServerError,
        isTrusted: false,
        cause: error,
      }),
    );
  }
})();
