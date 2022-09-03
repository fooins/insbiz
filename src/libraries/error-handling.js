const util = require('util');
const logger = require('./logger')('error-handling');

/**
 * HTTP 服务引用
 */
let httpServerRef = null;

/**
 * 统一错误类
 */
class AppError extends Error {
  /**
   * 错误对象构造函数。
   * @param {string} name 错误名称
   * @param {string} message 错误消息
   * @param {number} HTTPStatus HTTP 状态代码
   * @param {boolean} isTrusted 是否可信的错误。不可信的错误通常会触发服务和进程关闭。
   */
  constructor(name, message, HTTPStatus = 500, isTrusted = true) {
    super(message);

    this.name = name;
    this.HTTPStatus = HTTPStatus;
    this.isTrusted = isTrusted;
  }
}

/**
 * 格式化错误对象
 * @param {unknown} errorToHandle 错误对象（不确定格式）
 * @returns {AppError} 统一错误对象
 */
const normalizeError = (errorToHandle) => {
  if (errorToHandle instanceof AppError) {
    return errorToHandle;
  }

  if (errorToHandle instanceof Error) {
    const appError = new AppError(errorToHandle.name, errorToHandle.message);
    appError.stack = errorToHandle.stack;
    return appError;
  }

  const type = typeof errorToHandle;
  const value = util.inspect(errorToHandle);
  return new AppError(
    'general-error',
    `错误处理程序收到一个非错误类型的实例：${type} ${value}`,
  );
};

/**
 * 终止 HTTP 服务并退出进程
 */
const terminateHttpServerAndExit = async () => {
  if (httpServerRef) {
    await httpServerRef.close();
  }
  process.exit();
};

/**
 * 处理错误。
 * @param {unknown} errorToHandle 错误对象
 */
const handleError = (errorToHandle) => {
  try {
    const appError = normalizeError(errorToHandle);

    // 记录日志
    logger.error(appError.message, { ...appError });

    // 不可信的错误触发服务和进程关闭
    if (!appError.isTrusted) {
      terminateHttpServerAndExit();
    }
  } catch (handlingError) {
    // 这里没有记录日志，因为它可能已经失败了
    process.stdout.write(
      '错误处理失败，这是失败信息，以及它试图处理的原始错误信息',
    );
    process.stdout.write(JSON.stringify(handlingError));
    process.stdout.write(JSON.stringify(errorToHandle));
  }
};

/**
 * 监听全局错误事件
 * @param {Http.Server} httpServer HTTP 服务
 */
const listenToErrorEvents = (httpServer) => {
  httpServerRef = httpServer;

  process.on('uncaughtException', async (error) => {
    await handleError(error);
  });

  process.on('unhandledRejection', async (reason) => {
    await handleError(reason);
  });

  process.on('SIGTERM', async () => {
    logger.error('应用程序收到 SIGTERM 事件，尝试优雅地关闭服务器');
    await terminateHttpServerAndExit();
  });

  process.on('SIGINT', async () => {
    logger.error('应用程序收到 SIGINT 事件，尝试优雅地关闭服务器');
    await terminateHttpServerAndExit();
  });
};

module.exports = {
  AppError,
  handleError,
  listenToErrorEvents,
};
