const { startHttpServer } = require('./server');
const logger = require('./libraries/logger')('start');
const { validateConfigs } = require('./libraries/configuration');
const {
  handleError,
  AppError,
  ErrorCodes,
} = require('./libraries/error-handling');

(async () => {
  try {
    validateConfigs();
    logger.info('所有配置校验通过');

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
