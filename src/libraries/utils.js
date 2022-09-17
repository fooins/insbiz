const moment = require('moment');
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

/**
 * 确定对象是否具有具有指定名称的属性
 * @param {object} obj 指定对象
 * @param {string} propertyKey 指定名称
 * @returns {boolean}
 */
const hasOwnProperty = (obj, propertyKey) =>
  Object.prototype.hasOwnProperty.call(obj, propertyKey);

/**
 * 将时间精确到指定单位
 * 指定单位后的均补零
 * @param {any} datetime 时间
 * @param {string} unit 时间单位
 * @returns 精确后的时间（moment 对象）
 */
const timeCorrectTo = (datetime, unit) => {
  const result = moment(datetime);
  const seq = {
    second: 0,
    minute: 1,
    hour: 2,
    day: 3,
    month: 4,
    year: 5,
  };

  if (seq[unit] > 0) {
    result.second(0);
  }

  if (seq[unit] > 1) {
    result.minutes(0);
  }

  if (seq[unit] > 2) {
    result.hours(0);
  }

  if (seq[unit] > 3) {
    result.date(1);
  }

  if (seq[unit] > 4) {
    result.month(0);
  }

  return result;
};

module.exports = {
  error400,
  error500,
  hasOwnProperty,
  timeCorrectTo,
};
