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

/**
 * 500 错误
 * @param {string} message 消息
 * @param {object} options 选项
 * @returns {AppError} 错误对象
 */
const error500 = (message, options = {}) =>
  new AppError(message, {
    code: ErrorCodes.InternalServerError,
    HTTPStatus: 500,
    target: options.target || undefined,
    details: options.details || undefined,
    innerError: options.innerError || undefined,
    cause: options.cause || undefined,
    isTrusted: Object.prototype.hasOwnProperty.call(options, 'isTrusted')
      ? options.isTrusted
      : true,
  });

const hasOwnProperty = (obj, propertyKey) =>
  Object.prototype.hasOwnProperty.call(obj, propertyKey);

module.exports = {
  error400,
  error500,
  hasOwnProperty,
};
