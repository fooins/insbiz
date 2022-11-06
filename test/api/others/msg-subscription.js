const uuid = require('uuid');
const moment = require('moment');
const CryptoJS = require('crypto-js');
const Koa = require('koa');
const koaBody = require('koa-body');
const unparsed = require('koa-body/unparsed');
const {
  beforeAll,
  afterAll,
  describe,
  test,
  expect,
  // eslint-disable-next-line import/no-extraneous-dependencies
} = require('@jest/globals');
const { getDbConnection } = require('../../../src/libraries/data-access');
const { aesEncrypt } = require('../../../src/libraries/crypto');
const { getRandomChars, sleep } = require('../../../src/libraries/utils');
const {
  getProducerModel,
  getSecretModel,
  getNotifyTaskModel,
} = require('../../../src/models');

// 定义一个上下文变量
const ctx = {
  timeout: 15000,
  msgs: {},
};

/**
 * 创建依赖数据
 * @param {object} options
 */
const genDependencies = async (options = {}) => {
  // 创建销售渠道
  const producerCode = `TEST-MSGSBUS-${Date.now()}`;
  await getProducerModel().create({
    name: '销售渠道(消息订阅测试)',
    code: producerCode,
    notifyUrl: options.notifyUrl,
  });
  ctx.producer = await getProducerModel().findOne({
    where: { code: producerCode },
  });

  // 创建密钥
  ctx.secretId = uuid.v4();
  ctx.secretKey = getRandomChars(36);
  await getSecretModel().create({
    secretId: ctx.secretId,
    secretKey: aesEncrypt(ctx.secretKey),
    producerId: ctx.producer.id,
  });
};

/**
 * 清除依赖数据
 */
const clearnDependencies = async () => {
  // 删除密钥
  await getSecretModel().destroy({ where: { secretId: ctx.secretId } });

  // 删除销售渠道
  await getProducerModel().destroy({ where: { id: ctx.producer.id } });
};

/**
 * 清除产生的测试数据
 */
const clearnTestDatas = async () => {
  // 删除通知任务
  await getNotifyTaskModel().destroy({
    where: { producerId: ctx.producer.id },
  });
};

/**
 * 401 错误
 */
const error401 = () => new Error('签名验证失败');

/**
 * 获取凭证信息
 * @param {object} context 请求的上下文
 * @returns {object} 凭证信息
 */
const getAuthInfo = async (context) => {
  // 获取请求头的凭证字符串
  const authStr = context.headers.authorization;
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
  if (secretId !== ctx.secretId) throw error401();

  // 验证时间戳
  if (
    `${timestamp}`.length !== 10 ||
    !/^[0-9]*$/.test(`${timestamp}`) ||
    !moment(timestamp * 1000).isValid() ||
    moment(timestamp * 1000).isBefore(moment().subtract(1, 'minute'))
  ) {
    throw error401();
  }

  return { timestamp, signature };
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
 * @param {object} context 请求的上下文
 */
const verifySignature = async (context) => {
  const { path, query, body } = context.request;
  const { timestamp, signature } = await getAuthInfo(context);

  // 组装查询参数字符串
  const queryStr = getQueryStr(query);

  // 获取原始请求体
  const rawBody = body[unparsed];

  // 生成正确的签名值
  const signatureValid = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA1(
      `${ctx.secretId}${timestamp}${path}${queryStr}${rawBody}`,
      ctx.secretKey,
    ),
  );

  if (signature !== signatureValid) throw error401();
};

// 文件内所有测试开始前执行的钩子函数
beforeAll(async () => {
  // 启动 HTTP 服务
  const app = new Koa();
  app.use(koaBody({ includeUnparsed: true, jsonLimit: '10mb' }));
  app.use(async (context) => {
    const { body } = context.request;

    if (body && body.testFlag) {
      const key = body.testFlag;
      if (!Object.prototype.hasOwnProperty.call(ctx.msgs, key)) {
        ctx.msgs[key] = [];
      }
      ctx.msgs[key].push({ context });
    }

    context.body = '';
  });
  await Promise.race([
    new Promise((resolve) => {
      ctx.httpServer = app.listen(0, '127.0.0.1', () => {
        ctx.address = ctx.httpServer.address();
        resolve(true);
      });
    }),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('启动HTTP服务超时'));
      }, 3000);
    }),
  ]);

  // 创建依赖数据
  await genDependencies({
    notifyUrl: `http://${ctx.address.address}:${ctx.address.port}`,
  });
});

// 文件内所有测试完成后执行的钩子函数
afterAll(async () => {
  // 关闭 HTTP 服务
  ctx.httpServer.close();

  // 清除依赖数据
  await clearnDependencies();

  // 清除产生的测试数据
  await clearnTestDatas();

  // 关闭数据库连接
  await getDbConnection().close();
});

// 测试逻辑
describe('消息订阅', () => {
  test(
    '当添加理赔状态变更通知任务后，应接收到对应的通知',
    async () => {
      // 1. 配置
      const testFlag = 'testAddTask';
      const notifyData = {
        body: {
          type: 'ClaimStatusChange',
          content: {
            claimNo: 'C00000001',
            policyNo: 'P0000000000001',
            status: 'paying',
          },
          testFlag,
        },
      };
      await getNotifyTaskModel().create({
        type: 'ClaimStatusChange',
        data: JSON.stringify(notifyData),
        producerId: ctx.producer.id,
      });

      // 2. 执行
      let msg = null;
      let wait = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [message] = ctx.msgs[testFlag] || [];
        if (message) {
          msg = message;
          break;
        }

        const waitingTime = 1000;
        // eslint-disable-next-line no-await-in-loop
        await sleep(waitingTime);

        wait += waitingTime;
        if (wait > ctx.timeout) {
          throw new Error('等待超时超时');
        }
      }

      // 3. 断言
      const { context } = msg;
      const { body } = context.request;
      await verifySignature(context); // 验证签名
      expect(body).toMatchObject({
        type: notifyData.body.type,
        content: {
          claimNo: notifyData.body.content.claimNo,
          policyNo: notifyData.body.content.policyNo,
          status: notifyData.body.content.status,
        },
      });
    },
    ctx.timeout,
  );
});
