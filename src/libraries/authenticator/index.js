const CryptoJS = require('crypto-js');
const moment = require('moment');
const unparsed = require('koa-body/unparsed');
const { AppError, ErrorCodes } = require('../error-handling');
const { aesDecrypt } = require('../crypto');
const { getSecretBySecretId } = require('./dao');

/**
 * 401 错误
 */
const error401 = () =>
  new AppError('客户端未经授权。', {
    HTTPStatus: 401,
    code: ErrorCodes.Unauthorized,
  });

/**
 * 获取凭证信息
 * @param {object} ctx 请求的上下文
 * @returns {object} 凭证信息
 */
const getAuthInfo = async (ctx) => {
  // 获取请求头的凭证字符串
  const authStr = ctx.headers.authorization;
  if (!authStr) throw error401();

  // 拆分键值对
  const [secretIdPair, timestampPair, signaturePair] = authStr.split(',');
  if (!secretIdPair || !timestampPair || !signaturePair) {
    throw error401();
  }

  // 解析键值对
  const [secretIdKey, secretId] = secretIdPair.trim().split('=');
  const [timestampKey, timestamp] = timestampPair.trim().split('=');
  const [signatureKey] = signaturePair.trim().split('=');
  if (
    secretIdKey !== 'SecretId' ||
    timestampKey !== 'Timestamp' ||
    signatureKey !== 'Signature' ||
    !secretId ||
    !timestamp
  ) {
    throw error401();
  }

  // 单独解析签名值，因为其中可能包含特殊符号 “=”
  const signature = signaturePair.trim().substring(10);
  if (!signature) throw error401();

  // 验证密钥标识
  const secretInfo = await getSecretBySecretId(secretId);
  if (!secretInfo) throw error401();

  // 验证时间戳
  if (
    `${timestamp}`.length !== 10 ||
    !/^[0-9]*$/.test(`${timestamp}`) ||
    !moment(timestamp * 1000).isValid() ||
    moment(timestamp * 1000).isBefore(moment().subtract(60, 'minute'))
  ) {
    throw error401();
  }

  // 解密密钥
  const secretKey = aesDecrypt(secretInfo.secretKey);

  return { secretId, secretKey, timestamp, signature, secretInfo };
};

/**
 * 获取查询参数字符串
 * @param {object} query 查询参数对象
 * @returns {string} 查询参数字符串
 */
const getQueryStr = (query) => {
  const keys = Object.keys(query);
  keys.sort();

  const pairs = [];
  keys.forEach((key) => {
    pairs.push(`${key}=${query[key]}`);
  });

  return pairs.join('&');
};

/**
 * 验证签名
 * @param {object} ctx 请求的上下文
 * @param {object} authInfo 凭证信息
 */
const verifySignature = (ctx, authInfo) => {
  const { path, query, body } = ctx.request;
  const { secretId, secretKey, timestamp, signature } = authInfo;

  // 组装查询参数字符串
  const queryStr = getQueryStr(query);

  // 获取原始请求体
  const rawBody = body[unparsed] || '';

  // 生成正确的签名值
  const signatureValid = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA1(
      `${secretId}${timestamp}${path}${queryStr}${rawBody}`,
      secretKey,
    ),
  );

  if (signature !== signatureValid) throw error401();
};

/**
 * 设置上下文
 * @param {object} ctx 请求的上下文
 * @param {object} authInfo 凭证信息
 */
const setContext = async (ctx, authInfo) => {
  const { secretInfo } = authInfo;
  const { Producer: producer } = secretInfo;

  ctx.profile = {
    producer: {
      id: producer.id,
      name: producer.name,
      code: producer.code,
    },
  };
};

/**
 * 鉴权中间件
 * @param {object} ctx 请求的上下文
 * @param {function} next 一个用于执行下游中间件的函数
 */
module.exports = async function authenticator(ctx, next) {
  // 获取凭证信息
  const authInfo = await getAuthInfo(ctx);

  // 验证签名
  verifySignature(ctx, authInfo);

  // 设置上下文
  setContext(ctx, authInfo);

  // 执行下游中间件
  await next();
};
