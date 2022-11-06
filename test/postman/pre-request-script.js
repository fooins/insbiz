/* eslint-disable array-callback-return */
/* eslint-disable no-undef */

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

// 查询参数字符串
const query = {};
pm.request.url.query.map(({ key, value }) => {
  query[key] = value;
});
const queryStr = getQueryStr(query);

// 密钥
const secretId = pm.variables.get('InsbizSecretId');
const secretKey = pm.variables.get('InsbizSecretKey');

// 请求路径
const path = pm.request.url.getPath();
// 原始请求体
const rawBody = pm.request.body.raw || '';
// 当前时间戳（秒级）
const timestamp = Math.floor(Date.now() / 1000);

// 签名
const signature = CryptoJS.enc.Base64.stringify(
  CryptoJS.HmacSHA1(
    `${secretId}${timestamp}${path}${queryStr}${rawBody}`,
    secretKey,
  ),
);

// 设置请求头
pm.request.addHeader(
  `Authorization: SecretId=${secretId}, Timestamp=${timestamp}, Signature=${signature}`,
);
