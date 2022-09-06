const { startHttpServer } = require('./server');
const logger = require('./libraries/logger')('start');
const { validateConfigs } = require('./libraries/configuration');
const { getDbConnection } = require('./libraries/data-access');
const {
  handleError,
  AppError,
  ErrorCodes,
} = require('./libraries/error-handling');

(async () => {
  try {
    validateConfigs();
    logger.info('所有配置校验通过');

    await getDbConnection().authenticate();
    logger.info('数据库连接成功');

    const addressInfo = await startHttpServer();
    logger.info('HTTP 服务启动成功', { addressInfo });
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
