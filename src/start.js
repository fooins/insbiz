const { startHttpServer } = require('./server');
const logger = require('./libraries/logger')('start');
const { handleError, AppError } = require('./libraries/error-handling');

Promise.all([startHttpServer()])
  .then((startResponses) => {
    logger.info('程序启动成功', {
      httpServer: startResponses[0],
    });
  })
  .catch((error) => {
    handleError(
      new AppError(error.message, {
        code: 'InternalServerError',
        isTrusted: false,
        cause: error,
      }),
    );
  });
