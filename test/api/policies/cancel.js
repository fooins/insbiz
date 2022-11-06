const uuid = require('uuid');
const moment = require('moment');
const axios = require('axios');
const config = require('config');
const { Op } = require('sequelize');
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
const { getBizConfig } = require('../../../src/libraries/biz-config');
const { getRedis } = require('../../../src/libraries/redis');
const {
  genPolicyNo,
} = require('../../../src/components/policies/services/accept');
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
  getApplicantModel,
  getInsuredModel,
} = require('../../../src/models');
const {
  getAuthorization,
  getRandomPeriod,
  getRandomId,
  getRandomContactNo,
  getRandomName,
  getRandomGender,
  getRandomBirth,
} = require('../../test-helper');

// 定义一个上下文变量
const ctx = {};

/**
 * 创建依赖数据
 */
const genDependencies = async () => {
  // 创建销售渠道
  const producerCode = `TEST-CANCEL-${Date.now()}`;
  await getProducerModel().create({
    name: '销售渠道(退保测试)',
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
  const productCode = `TEST-CANCEL-${Date.now()}`;
  await getProductModel().create({
    name: '保险产品(退保测试)',
    code: productCode,
    version: 1,
  });
  ctx.product = await getProductModel().findOne({
    where: { code: productCode },
  });

  // 创建保险计划
  const planCode = `TEST-CANCEL-${Date.now()}`;
  await getPlanModel().create({
    name: '保险计划(退保测试)',
    code: planCode,
    version: 1,
    productId: ctx.product.id,
  });
  ctx.plan = await getPlanModel().findOne({
    where: { code: planCode },
  });

  // 创建授权契约
  const contractCode = `TEST-CANCEL-${Date.now()}`;
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

  // 获取业务规则配置
  ctx.bizConfig = await getBizConfig({
    product: ctx.product,
    plan: ctx.plan,
    producer: ctx.producer,
    contract: ctx.contract,
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
  // 查询需要删除的保单
  const policies = await getPolicyModel().findAll({
    attributes: ['id'],
    where: {
      contractId: ctx.contract.id,
      contractVersion: ctx.contract.version,
      planId: ctx.plan.id,
    },
  });
  const policyIds = policies.map((p) => p.id);

  // 删除保单
  await getPolicyModel().destroy({
    where: {
      id: {
        [Op.in]: policyIds,
      },
    },
  });

  // 删除投保人
  await getApplicantModel().destroy({
    where: {
      policyId: {
        [Op.in]: policyIds,
      },
    },
  });

  // 删除被保险人
  await getInsuredModel().destroy({
    where: {
      policyId: {
        [Op.in]: policyIds,
      },
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
    method: 'DELETE',
    baseURL: ctx.url,
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

  // 断开Redis连接
  await getRedis().end();
});

// 测试逻辑
describe('退保接口', () => {
  test('当退保成功时，应相应改变保单状态', async () => {
    // 1. 配置
    let policy = null;
    let url = '';
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
      // 允许退保
      ctx.bizConfig.cancel.allowCancel = true;

      // 构造保单
      policy = await getPolicyModel().create({
        effectiveTime,
        expiryTime,
        orderNo: md5(uuid.v4()),
        policyNo: await genPolicyNo(),
        producerId: ctx.producer.id,
        contractId: ctx.contract.id,
        contractVersion: ctx.contract.version,
        productId: ctx.product.id,
        productVersion: ctx.product.version,
        planId: ctx.plan.id,
        bizConfig: JSON.stringify(ctx.bizConfig),
        boundTime: moment().toISOString(true),
        premium: getRandomNum(1, 1000),
        status: 'valid',
        extensions: JSON.stringify({}),
      });
      // 构造投保人
      const applicant = await getApplicantModel().create({
        idType,
        idNo,
        contactNo,
        no: uuid.v4(),
        policyId: policy.id,
        name: getRandomName(),
        gender: getRandomGender(),
        birth: getRandomBirth(),
        email: `${contactNo}@qq.com`,
      });
      // 构造被保险人
      await getInsuredModel().create({
        idType,
        idNo,
        contactNo,
        no: uuid.v4(),
        relationship: 'self',
        policyId: policy.id,
        name: applicant.name,
        gender: applicant.gender,
        birth: applicant.birth,
        email: applicant.email,
        premium: getRandomNum(1, 1000),
      });

      // 请求地址
      url = `/${policy.policyNo}`;
      // 鉴权信息
      authStr = getAuthorization(
        `${ctx.url}${url}`,
        '',
        ctx.secretId,
        ctx.secretKey,
      );
    }

    // 2. 执行
    const rst = await ctx.axiosClient.request({
      url,
      headers: { authorization: authStr },
    });
    const policyNew = await getPolicyModel().findOne({
      where: { id: policy.id },
    });

    // 3. 断言
    expect(rst).toMatchObject({
      status: 200,
      data: {
        policyNo: policy.policyNo,
        endorseNo: expect.stringMatching(/^[0-9]*$/),
        difference: expect.any(Number),
      },
    });
    expect(policyNew).toMatchObject({
      status: 'canceled',
    });
  });
});
