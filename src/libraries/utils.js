const moment = require('moment');
const crypto = require('crypto');
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
 * 403 错误
 * @param {string} message 消息
 * @param {object} options 选项
 * @returns {AppError} 错误对象
 */
const error403 = (message, options = {}) =>
  new AppError(message || 'Access denied', {
    code: ErrorCodes.AccessDenied,
    HTTPStatus: 403,
    target: options.target || undefined,
    details: options.details || undefined,
    innerError: options.innerError || undefined,
    cause: options.cause || undefined,
  });

/**
 * 404 错误
 * @param {string} message 消息
 * @param {object} options 选项
 * @returns {AppError} 错误对象
 */
const error404 = (message, options = {}) =>
  new AppError(message, {
    code: ErrorCodes.NotFound,
    HTTPStatus: 404,
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

/**
 * 解析身份证号码
 * @param {string} idNo 身份证号码
 * @returns {object}
 */
const parseIdCard = (idNo) => {
  const result = {
    gender: 'unknown',
    birth: null,
  };

  if (!idNo || (idNo.length !== 18 && idNo.length !== 15)) return result;

  // 性别代码
  // 二代身份证号码长度为18位（第17位为性别代码）
  // 一代身份证号码长度为15位（第15位为性别代码）
  const genderCode = idNo.length === 18 ? idNo.charAt(16) : idNo.charAt(14);

  // 识别性别：男奇女偶
  if (genderCode && !Number.isNaN(genderCode)) {
    if (parseInt(genderCode, 10) % 2 === 0) {
      result.gender = 'female';
    } else {
      result.gender = 'man';
    }
  }

  // 出生日期编码
  const birthCode =
    idNo.length === 18 ? idNo.substring(6, 14) : `19${idNo.substring(6, 12)}`;

  // 识别出生日期
  result.birth = moment(
    new Date(
      birthCode.substring(0, 4),
      birthCode.substring(4, 6) - 1,
      birthCode.substring(6, 8),
    ),
  );

  return result;
};

/**
 * 随眠指定时长
 * @param {integer} timeout 指定时长
 * @returns
 */
const sleep = async (timeout) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });

/**
 * 生成 [min,max] 的随机整数
 * @param {integer} min 最小值（包含）
 * @param {integer} max 最大值（包含）
 * @returns {integer}
 */
const getRandomNum = (min, max) =>
  parseInt(Math.random() * (max - min + 1) + min, 10);

/**
 * 执行 MD5 加密
 * @param {string} data
 * @returns
 */
const md5 = (data) => crypto.createHash('md5').update(data).digest('hex');

/**
 * 获取指定长度的随机字符
 * @param {number} length 长度
 * @returns {string}
 */
function getRandomChars(length) {
  const seed = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    '!',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
  ];

  let key = '';
  for (let i = 0; i < length; i += 1) {
    key += seed[getRandomNum(0, seed.length)];
  }

  return key;
}

module.exports = {
  error400,
  error403,
  error404,
  error500,
  hasOwnProperty,
  timeCorrectTo,
  parseIdCard,
  sleep,
  getRandomNum,
  getRandomChars,
  md5,
};
