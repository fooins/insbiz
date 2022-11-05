const uuid = require('uuid');
const axios = require('axios');
const config = require('config');
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
const {
  getRandomChars,
  md5,
  getRandomNum,
} = require('../../../src/libraries/utils');
const {
  getProducerModel,
  getProductModel,
  getPlanModel,
  getContractModel,
  getSecretModel,
  getPolicyModel,
} = require('../../../src/models');
const {
  getAuthorization,
  getRandomPeriod,
  getRandomId,
  getRandomContactNo,
  getRandomName,
  getRandomGender,
  getRandomBirth,
  getRandomRelationship,
} = require('../../test-helper');

// 定义一个上下文变量
const ctx = {};

/**
 * 创建依赖数据
 */
const genDependencies = async () => {
  // 创建销售渠道
  const producerCode = `TEST-ACCEPT-${Date.now()}`;
  await getProducerModel().create({
    name: '销售渠道(承保测试)',
    code: producerCode,
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

  // 创建保险产品
  const productCode = `TEST-ACCEPT-${Date.now()}`;
  await getProductModel().create({
    name: '保险产品(承保测试)',
    code: productCode,
    version: 1,
  });
  ctx.product = await getProductModel().findOne({
    where: { code: productCode },
  });

  // 创建保险计划
  const planCode = `TEST-ACCEPT-${Date.now()}`;
  await getPlanModel().create({
    name: '保险计划(承保测试)',
    code: planCode,
    version: 1,
    productId: ctx.product.id,
  });
  ctx.plan = await getPlanModel().findOne({
    where: { code: planCode },
  });

  // 创建授权契约
  const contractCode = `TEST-ACCEPT-${Date.now()}`;
  await getContractModel().create({
    code: contractCode,
    version: 1,
    producerId: ctx.producer.id,
    productId: ctx.product.id,
    productVersion: ctx.product.version,
  });
  ctx.contract = await getContractModel().findOne({
    where: { code: contractCode },
  });
};

/**
 * 清除依赖数据
 */
const clearnDependencies = async () => {
  // 删除授权契约
  await getContractModel().destroy({ where: { id: ctx.contract.id } });

  // 删除保险计划
  await getPlanModel().destroy({ where: { id: ctx.plan.id } });

  // 删除保险产品
  await getProductModel().destroy({ where: { id: ctx.product.id } });

  // 删除密钥
  await getSecretModel().destroy({ where: { secretId: ctx.secretId } });

  // 删除销售渠道
  await getProducerModel().destroy({ where: { id: ctx.producer.id } });
};

/**
 * 清除产生的测试数据
 */
const clearnTestDatas = async () => {
  // 删除保单
  await getPolicyModel().destroy({
    where: {
      contractId: ctx.contract.id,
      contractVersion: ctx.contract.version,
      planId: ctx.plan.id,
    },
  });
};

// 文件内所有测试开始前执行的钩子函数
beforeAll(async () => {
  // 创建依赖数据
  await genDependencies();

  // 创建 Axios 客户端
  const port = config.get('server.port');
  const hostname = config.get('server.host');
  ctx.url = `http://${hostname}:${port}/v1.0/policies`;
  ctx.axiosClient = axios.create({
    method: 'POST',
    baseURL: ctx.url,
    headers: {
      'content-type': 'application/json',
    },
    validateStatus: () => true,
  });
});

// 文件内所有测试完成后执行的钩子函数
afterAll(async () => {
  // 清除依赖数据
  await clearnDependencies();

  // 清除产生的测试数据
  await clearnTestDatas();

  // 关闭数据库连接
  await getDbConnection().close();
});

// 测试逻辑
describe('承保接口', () => {
  test('当投保成功时，应得到其保单号', async () => {
    // 1. 配置
    let bodyStr = '';
    let authStr = '';
    {
      // 获取随机的保障期间
      const { effectiveTime, expiryTime } = getRandomPeriod({
        efficient: false,
      });
      // 生成随机证件信息
      const { idType, idNo } = getRandomId();
      // 获取随机联系号码
      const contactNo = getRandomContactNo();

      // 请求体
      const body = {
        effectiveTime,
        expiryTime,
        orderNo: md5(uuid.v4()),
        contractCode: ctx.contract.code,
        contractVersion: `${ctx.contract.version}`,
        planCode: ctx.plan.code,
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

      // 生成配置数据
      bodyStr = JSON.stringify(body);
      authStr = getAuthorization(ctx.url, bodyStr, ctx.secretId, ctx.secretKey);
    }

    // 2. 执行
    const rst = await ctx.axiosClient.request({
      data: bodyStr,
      headers: { authorization: authStr },
    });

    // 3. 断言
    expect(rst).toMatchObject({
      status: 201,
      data: { policyNo: expect.stringMatching(/^FOOINS[0-9a-zA-Z]*$/) },
    });
  });
});
