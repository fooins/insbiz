const app = require("./app");

// 定义端口和主机名
const port = process.env.PORT || 8080;
const hostname = process.env.HOST || "127.0.0.1";

// 创建 HTTP 服务并监听端口
app.listen(port, hostname, () => {
  console.info(`HTTP 服务启动成功 ${host}:${port}`);
});
