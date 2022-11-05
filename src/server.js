const config = require('config');
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
 * @param {object} options 附加选项
 * @returns {Http.Server.AddressInfo} 服务地址信息
 */
const startHttpServer = async (options = {}) =>
  new Promise((resolve) => {
    // 定义端口和主机名
    const port = options.port || config.get('server.port');
    const hostname = options.hostname || config.get('server.host');

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

    // 创建 HTTP 服务并监听端口
    httpServer = app.listen(port, hostname, () => {
      listenToErrorEvents(httpServer);
      resolve(httpServer.address());
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
