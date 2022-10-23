// 默认配置文件
// 包含全量配置项，会被实际配置合并和覆盖
module.exports = {
  // 服务配置
  server: {
    // 主机名
    host: '127.0.0.1',
    // 端口号
    port: 8080,
  },
  // 是否调度作业
  scheduleJob: true,
  // 数据库
  db: {
    // 主机名或IP
    host: '127.0.0.1',
    // 端口号
    port: 3306,
    // 用户名
    username: '',
    // 密码
    password: '',
    // 数据库名
    database: 'insbiz',
  },
  // 加密相关配置
  crypto: {
    // AES 密钥
    aesKey: '',
  },
  // Redis
  redis: {
    // 主机名
    host: '127.0.0.1',
    // 端口号
    port: 6379,
    // 密码
    password: '123456',
    // 数据库索引
    db: 0,
  },
};
