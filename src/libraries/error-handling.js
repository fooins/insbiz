const util = require('util');
const logger = require('./logger')('error-handling');
const { respFail } = require('./response');

/**
 * HTTP 服务引用
 */
let httpServerRef = null;

/**
 * 错误代码枚举
 */
const ErrorCodes = {
  Unauthorized: 'Unauthorized',
  AccessDenied: 'AccessDenied',
  InvalidRequest: 'InvalidRequest',
  NotFound: 'NotFound',
  InternalServerError: 'InternalServerError',
  ServiceUnavailable: 'ServiceUnavailable',
  GeneralException: 'GeneralException',
};

/**
 * 统一错误类
 */
class AppError extends Error {
  /**
   * 错误对象构造函数。
   *
   * addition
   *  - code<string>：错误代码
   *  - HTTPStatus<number>：HTTP 状态代码
   *  - isTrusted<boolean>：是否可信的错误，不可信的错误通常会触发服务和进程关闭
   *  - cause<unknown>：错误根因
   *
   * @param {string} message 错误消息
   * @param {object} addition 附加信息
   */
  constructor(message, addition = {}) {
    super(message);

    const {
      code = ErrorCodes.GeneralException,
      HTTPStatus = 500,
      isTrusted = true,
      target,
      details,
      innerError,
      cause,
    } = addition;

    this.code = code;
    this.HTTPStatus = HTTPStatus;
    this.isTrusted = isTrusted;
    if (target) this.target = target;
    if (details) this.details = details;
    if (innerError) this.innerError = innerError;
    if (cause) this.cause = cause;
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
    const appError = new AppError(errorToHandle.message, {
      cause: errorToHandle,
    });
    appError.stack = errorToHandle.stack;
    return appError;
  }

  const type = typeof errorToHandle;
  const value = util.inspect(errorToHandle);
  return new AppError(
    `错误处理程序收到一个未知的错误类型实例：${type} ${value}`,
    {
      cause: errorToHandle,
    },
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
    logger.error(appError, { ...appError });

    // 不可信的错误触发服务和进程关闭
    if (!appError.isTrusted) {
      logger.on('finish', () => {
        terminateHttpServerAndExit();
      });
    }

    return appError;
  } catch (handlingError) {
    // 这里没有记录日志，因为它可能已经失败了
    process.stdout.write(
      '错误处理失败，这是失败信息，以及它试图处理的原始错误信息',
    );
    process.stdout.write(JSON.stringify(handlingError));
    process.stdout.write(JSON.stringify(errorToHandle));

    return null;
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

/**
 * 处理路由错误的中间件
 * @param {object} ctx 请求的上下文
 * @param {function} next 一个用于执行下游中间件的函数
 */
const handleRouteErrors = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
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
  }
};

module.exports = {
  AppError,
  ErrorCodes,
  handleError,
  listenToErrorEvents,
  handleRouteErrors,
};
