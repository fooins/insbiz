const app = require('./app');
const logger = require('./libraries/logger')('server');

// 定义端口和主机名
const port = process.env.PORT || 8080;
const hostname = process.env.HOST || '127.0.0.1';

// 创建 HTTP 服务并监听端口
app.listen(port, hostname, () => {
  logger.info(`HTTP 服务启动成功 ${hostname}:${port}`);
});
