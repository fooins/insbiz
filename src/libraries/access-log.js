const path = require('path');
const rTracer = require('cls-rtracer');
const winston = require('winston');
require('winston-daily-rotate-file');

// 实例化日志记录器
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: path.join(__dirname, '../../logs/'), // 存储的目录
      filename: `access-log-%DATE%`, // 文件名
      datePattern: 'YYYY-MM-DD', // 文件名中的日期格式
      zippedArchive: true, // 是否开启压缩（除当前日志文件之外的文件）
      maxSize: '100m', // 文件最大大小，超过之后会自动滚动为多个文件
      maxFiles: '14d', // 最多保留多少天的日志文件，超过的会被删除（不加“d”的话则是最多保留多少个文件）
      extension: '.log', // 文件后缀
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) =>
        `${info.timestamp}|${process.pid}|${rTracer.id()}|${info.message}`,
    ),
  ),
});

/**
 * 记录 API 访问日志的中间件
 * @param {object} ctx 请求的上下文
 * @param {function} next 一个用于执行下游中间件的函数
 */
module.exports = async (ctx, next) => {
  // 记录请求日志
  logger.info(
    [
      'Req',
      ctx.ip,
      ctx.method,
      ctx.protocol,
      ctx.url,
      ctx.headers['content-length'] || '',
      ctx.headers['user-agent'] || '',
    ].join('|'),
  );

  // 执行接口逻辑
  const start = Date.now();
  await next();
  const end = Date.now();
  const cost = end - start;

  // 记录响应日志
  logger.info(['Res', ctx.length, ctx.status, `${cost}ms`].join('|'));
};
