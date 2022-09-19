// 本工具扩展自 winston（https://github.com/winstonjs/winston）
//
// 本工具使用一套适用于本工程的默认配置来初始化每个日志记录器（logger），
// 最终返回一个原始的 winston 日志记录器对象，
// 你也可以使用 winston 原有的能力对其进行自定义配置，比如 `logger.configure({ ... })`。

const path = require('path');
const rTracer = require('cls-rtracer');
const winston = require('winston');
require('winston-daily-rotate-file');
const env = require('./env');

/**
 * 获取日志记录器。
 * @param {string} name 记录器名称
 * @param {object} options 可覆盖创建 winston 记录器时传入的选项
 * @returns winston 日志记录器对象
 */
module.exports = function getLogger(name, options = {}) {
  if (!winston.loggers.has(name)) {
    // 日志级别
    const level = env.isProd() ? 'warn' : 'silly';

    // 日志存储的目录
    const dirname = path.join(__dirname, '../../logs/');

    // 日志传输方式
    const transports = [
      // 所有级别的日志记录到一个统一的文件中
      // 按照日期滚动
      new winston.transports.DailyRotateFile({
        dirname, // 存储的目录
        filename: `${name}-%DATE%`, // 文件名
        datePattern: 'YYYY-MM-DD', // 文件名中的日期格式
        zippedArchive: true, // 是否开启压缩（除当前日志文件之外的文件）
        maxSize: '100m', // 文件最大大小，超过之后会自动滚动为多个文件
        maxFiles: '14d', // 最多保留多少天的日志文件，超过的会被删除（不加“d”的话则是最多保留多少个文件）
        extension: '.log', // 文件后缀
      }),
      // 错误级别的日志单独再记录一份，以便处理
      // 按大小滚动
      new winston.transports.File({
        dirname, // 存储的目录
        level: 'error', // 适用的日志级别
        filename: `${name}-error.log`, // 文件名
        tailable: true, // 是否开启滚动
        maxsize: 1024 * 100, // 文件最大大小（字节）
        maxFiles: 10, // 最多保留多少个日志文件，超过的会被删除
      }),
    ];

    // 非生产环境同时打印到控制台
    if (!env.isProd() && !options.noConsole) {
      transports.push(new winston.transports.Console());
    }

    // 自定义格式
    const customFormat = winston.format((info) => {
      // 跟踪标识
      // eslint-disable-next-line no-param-reassign
      info.tid = rTracer.id();

      // 进程ID
      // eslint-disable-next-line no-param-reassign
      info.pid = process.pid;

      return info;
    });

    // 创建日志记录器并缓存
    winston.loggers.add(name, {
      level,
      transports,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        customFormat(),
        winston.format.json(),
      ),
      ...options,
    });
  }

  return winston.loggers.get(name);
};
