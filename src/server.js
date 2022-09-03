const app = require('./app');
const logger = require('./libraries/logger')('server');
const { listenToErrorEvents } = require('./libraries/error-handling');

/**
 * 服务实例
 */
let httpServer;

/**
 * 启动服务
 * @returns {Http.Server.AddressInfo} 服务地址信息
 */
const startHttpServer = async () => new Promise((resolve) => {
  // 定义端口和主机名
  const port = process.env.PORT || 8080;
  const hostname = process.env.HOST || '127.0.0.1';

  // 创建 HTTP 服务并监听端口
  logger.info(`正在启动 HTTP 服务 ${hostname}:${port}`);
  httpServer = app.listen(port, hostname, () => {
    listenToErrorEvents(httpServer);
    resolve(httpServer.address());
  });
});

/**
 * 停止服务
 */
const stopHttpServer = () => new Promise((resolve) => {
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
