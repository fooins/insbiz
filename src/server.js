const app = require('./app');
const { respFail } = require('./libraries/response');
const {
  listenToErrorEvents,
  handleError,
  ErrorCodes,
} = require('./libraries/error-handling');

/**
 * 服务实例
 */
let httpServer;

/**
 * 启动服务
 * @returns {Http.Server.AddressInfo} 服务地址信息
 */
const startHttpServer = async () =>
  new Promise((resolve) => {
    // 定义端口和主机名
    const port = process.env.PORT || 8080;
    const hostname = process.env.HOST || '127.0.0.1';

    // 创建 HTTP 服务并监听端口
    httpServer = app.listen(port, hostname, () => {
      listenToErrorEvents(httpServer);
      resolve(httpServer.address());
    });

    // 监听错误事件
    app.on('error', (error, ctx) => {
      const {
        code = ErrorCodes.GeneralException,
        message = 'general exception',
        HTTPStatus = 500,
        target,
        details,
        innerError,
      } = handleError(error) || {};

      respFail(ctx, code, message, {
        status: HTTPStatus,
        target,
        details,
        innerError,
      });
    });
  });

/**
 * 停止服务
 */
const stopHttpServer = () =>
  new Promise((resolve) => {
    if (httpServer !== undefined) {
      httpServer.close(() => {
        resolve();
      });
    }
  });

module.exports = {
  startHttpServer,
  stopHttpServer,
};
