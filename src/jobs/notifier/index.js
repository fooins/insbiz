const _ = require('lodash');
const moment = require('moment');
const CryptoJS = require('crypto-js');
const axios = require('axios');
const dao = require('./dao');
const { error400 } = require('../../libraries/utils');
const { aesDecrypt } = require('../../libraries/crypto');

/**
 * 查询待处理的任务
 * @returns {array} 待处理的任务
 */
const queryPendingTasks = async () => {
  // 查询待处理的任务
  const tasks = await dao.queryPendingNotifyTasks();

  // 更新状态为处理中
  await dao.handingTasks(tasks);

  return tasks;
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
 * 执行通知
 * @param {object} task 通知任务
 */
const notify = async (task) => {
  const { Producer: producer, Secrets } = task;
  const [secret] = Secrets;

  // 数据校验
  if (!producer || !producer.notifyUrl) throw error400('渠道通知地址有误');
  if (!secret) throw error400('渠道密钥有误');

  // 更新任务
  await dao.updateNotifyTask(
    {
      handledAt: Date.now(),
      retries: task.status === 'pending' ? 0 : task.retries + 1,
    },
    { id: task.id },
  );

  // 解析通知地址
  const url = new URL(producer.notifyUrl);

  // 生成签名
  const timestamp = Math.floor(Date.now() / 1000); // 当前时间戳（秒级）
  const path = url.pathname; // 请求路径
  const queryStr = getQueryStr(url.searchParams); // 查询参数字符串
  const rawBody = JSON.stringify(task.dataParsed.body); // 原始请求体
  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA1(
      `${secret.secretId}${timestamp}${path}${queryStr}${rawBody}`,
      aesDecrypt(secret.secretKey),
    ),
  );

  // 发起请求
  await axios
    .request({
      url: producer.notifyUrl,
      method: 'POST',
      headers: {
        Authorization: `SecretId=${secret.secretId}, Timestamp=${timestamp}, Signature=${signature}`,
      },
      data: rawBody,
    })
    .catch((error) => {
      // eslint-disable-next-line no-param-reassign
      error.retry = true;
      throw error;
    });

  // 更新任务
  await dao.updateNotifyTask(
    {
      status: 'succeed',
      finishedAt: Date.now(),
    },
    { id: task.id },
  );
};

/**
 * 执行处理
 * @param {object} task 任务
 */
const handler = async (task) => {
  try {
    await notify(task);
  } catch (error) {
    const data = {
      status: 'failure',
      finishedAt: Date.now(),
      failureReasons: JSON.stringify({
        message: error.message,
        stack: error.stack,
      }),
      retryAt: null,
    };

    if (error.retry) {
      // 重试间隔
      const retryInterval = {
        0: { amount: 15, unit: 'seconds' },
        1: { amount: 30, unit: 'seconds' },
        2: { amount: 3, unit: 'minutes' },
        3: { amount: 10, unit: 'minutes' },
        4: { amount: 20, unit: 'minutes' },
        5: { amount: 30, unit: 'minutes' },
        6: { amount: 60, unit: 'minutes' },
        7: { amount: 3, unit: 'hours' },
        8: { amount: 6, unit: 'hours' },
        9: { amount: 24, unit: 'hours' },
      };

      data.status = task.retries > 9 ? 'failure' : 'retry';
      data.retryAt = retryInterval[task.retries]
        ? moment().add(
            retryInterval[task.retries].amount,
            retryInterval[task.retries].unit,
          )
        : null;
    }

    await dao.updateNotifyTask(data, { id: task.id });
  }
};

module.exports = async () => {
  // 查询待处理的任务
  const tasks = await queryPendingTasks();

  // 拆分批次
  const trunks = _.chunk(tasks, 10);

  // 分批执行处理
  for (let i = 0; i < trunks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(trunks[i].map((task) => handler(task)));
  }
};
