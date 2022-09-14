const { AppError, ErrorCodes } = require('./error-handling');

/**
 * 400 错误
 * @param {string} message 消息
 * @param {object} options 选项
 * @returns {AppError} 错误对象
 */
const error400 = (message, options = {}) =>
  new AppError(message, {
    code: ErrorCodes.InvalidRequest,
    HTTPStatus: 400,
    target: options.target || undefined,
    details: options.details || undefined,
    innerError: options.innerError || undefined,
    cause: options.cause || undefined,
  });

module.exports = {
  error400,
};
