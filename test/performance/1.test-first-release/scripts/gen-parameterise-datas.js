/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const CryptoJS = require('crypto-js');
const {
  getRandomPeriod,
  getRandomName,
  getRandomId,
  getRandomGender,
  getRandomBirth,
  getRandomContactNo,
  getRandomRelationship,
} = require('../../../test-helper');
const { getRandomNum, md5 } = require('../../../../src/libraries/utils');

/**
 * 生成配置信息
 * @param {object} ctx 上下文变量
 */
const genConfig = async (ctx) => {
  // 线程数
  const numberOfThreads = 1;
  // 循环次数
  const loopCount = 1;
  // 目标总保单数量
  ctx.total = numberOfThreads * loopCount * 4;

  // 签名密钥标识
  ctx.secretId = 'd73d0a29-0bea-42e5-a8a6-211bb998f8b6';
  // 签名密钥
  ctx.secretKey = 'n8Ih%mA9PL^X)%MN2e%cO(9=Uhczf7n+';

  // 接口主机
  ctx.host = 'http://124.222.120.210';

  // 文件输出目录
  ctx.outputDir = 'C:/Users/Max Fang/Desktop/';
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
 * 获取鉴权字符串
 * @param {object} ctx 上下文变量
 * @param {string} url 请求地址
 * @param {string} bodyStr 请求体
 * @returns {string}
 */
const getAuthStr = (ctx, url, bodyStr) => {
  // 解析URL
  const urlParsed = new URL(url);

  // 查询参数字符串
  const query = {};
  urlParsed.searchParams.forEach((val, key) => {
    query[key] = val;
  });
  const queryStr = getQueryStr(query);

  // 当前时间戳（秒级）
  const timestamp = Math.floor(Date.now() / 1000);

  // 签名
  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA1(
      `${ctx.secretId}${timestamp}${urlParsed.pathname}${queryStr}${bodyStr}`,
      ctx.secretKey,
    ),
  );

  return `SecretId=${ctx.secretId}, Timestamp=${timestamp}, Signature=${signature}`;
};

/**
 * 构造承保请求体
 * @returns {object}
 */
const genAcceptBody = () => {
  // 获取随机的保障期间
  const { effectiveTime, expiryTime } = getRandomPeriod({ efficient: false });
  // 生成随机证件信息
  const { idType, idNo } = getRandomId();
  // 获取随机联系号码
  const contactNo = getRandomContactNo();

  // 请求体
  const body = {
    effectiveTime,
    expiryTime,
    orderNo: md5(uuid.v4()),
    contractCode: 'C-BASE',
    contractVersion: '1',
    planCode: 'PL-BASE',
    premium: getRandomNum(1, 1000),
    extensions: { trackingNo: `${getRandomNum(10000000, 99999999)}` },
    applicants: [
      {
        idType,
        idNo,
        contactNo,
        name: getRandomName(),
        gender: getRandomGender(),
        birth: getRandomBirth(),
        email: `${contactNo}@qq.com`,
      },
    ],
    insureds: [],
  };

  // 追加被保险人
  for (let j = 0; j < getRandomNum(1, 2); j += 1) {
    // 生成随机证件信息
    const { idType: idTypeIns, idNo: idNoIns } = getRandomId();
    // 获取随机联系号码
    const contactNoIns = getRandomContactNo();

    body.insureds.push({
      relationship: getRandomRelationship(),
      name: getRandomName(),
      idType: idTypeIns,
      idNo: idNoIns,
      gender: getRandomGender(),
      birth: getRandomBirth(),
      contactNo: contactNoIns,
      email: `${contactNoIns}@qq.com`,
      premium: getRandomNum(1, 1000),
    });
  }

  return body;
};

/**
 * 将数据保存到文件
 * @param {array} datas 数据
 * @param {string} filename 保存的文件路径
 */
const saveToFile = async (datas, filename) => {
  // 组装数据
  let chunk = '';
  datas.forEach((data) => {
    chunk += data.join('\t');
    chunk += os.EOL;
  });

  // 创建追加写入流
  const writerAppend = fs.createWriteStream(filename, {
    flags: 'a',
    encoding: 'utf-8',
  });

  // 写入数据到流
  return new Promise((resolve, reject) => {
    writerAppend.write(chunk, 'utf-8', (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

/**
 * 构造报价数据
 * @param {object} ctx 上下文变量
 * @param {number} qty 数量
 */
const genQuoteDatas = async (ctx, qty) => {
  // 请求地址
  const url = `${ctx.host}/v1.0/policies/quote`;

  // 构造数据
  const quoteDatas = [];
  for (let i = 0; i < qty; i += 1) {
    // 请求体
    const bodyStr = JSON.stringify(genAcceptBody());

    // 获取鉴权字符串
    const authStr = getAuthStr(ctx, url, bodyStr);

    quoteDatas.push([bodyStr, authStr]);
  }

  // 保存到文件
  await saveToFile(quoteDatas, path.resolve(ctx.outputDir, 'quote.csv'));
};

/**
 * 构造承保数据
 * @param {object} ctx 上下文变量
 * @param {number} qty 数量
 */
const genAcceptDatas = async (ctx, qty) => {
  // 请求地址
  const url = `${ctx.host}/v1.0/policies`;

  // 构造数据
  const acceptDatas = [];
  for (let i = 0; i < qty; i += 1) {
    // 请求体
    const bodyStr = JSON.stringify(genAcceptBody());

    // 获取鉴权字符串
    const authStr = getAuthStr(ctx, url, bodyStr);

    acceptDatas.push([bodyStr, authStr]);
  }

  // 保存到文件
  await saveToFile(acceptDatas, path.resolve(ctx.outputDir, 'accept.csv'));
};

/**
 * 执行数据构造
 */
const gen = async () => {
  // 定义一个上下文变量
  const ctx = {};

  // 生成配置信息
  await genConfig(ctx);

  // 批量构造
  for (let i = 0; i < ctx.total; i += 4) {
    // 构造报价数据
    await genQuoteDatas(ctx, 2);

    // 构造承保数据
    await genAcceptDatas(ctx, 4);

    //
    //
    //
    //
    //
    //
    //

    // 构造查询保单数据
    // 构造申请理赔数据
  }
};

gen()
  .then(() => {
    console.info('参数化数据构造成功');
  })
  .catch((error) => {
    console.error(error);
    console.error(error.message);
  });
