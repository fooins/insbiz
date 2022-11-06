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
  getClaimModel,
  getClaimInsuredModel,
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
  const producerCode = `TEST-CLAIM-${Date.now()}`;
  await getProducerModel().create({
    name: '销售渠道(理赔测试)',
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
  const productCode = `TEST-CLAIM-${Date.now()}`;
  await getProductModel().create({
    name: '保险产品(理赔测试)',
    code: productCode,
    version: 1,
  });
  ctx.product = await getProductModel().findOne({
    where: { code: productCode },
  });

  // 创建保险计划
  const planCode = `TEST-CLAIM-${Date.now()}`;
  await getPlanModel().create({
    name: '保险计划(理赔测试)',
    code: planCode,
    version: 1,
    productId: ctx.product.id,
  });
  ctx.plan = await getPlanModel().findOne({
    where: { code: planCode },
  });

  // 创建授权契约
  const contractCode = `TEST-CLAIM-${Date.now()}`;
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

  // 查询需要删除的理赔单
  const claims = await getClaimModel().findAll({
    attributes: ['id'],
    where: {
      policyId: {
        [Op.in]: policyIds,
      },
    },
  });
  const claimIds = claims.map((c) => c.id);

  // 删除理赔单
  await getClaimModel().destroy({
    where: {
      id: {
        [Op.in]: claimIds,
      },
    },
  });

  // 删除理赔单被保险人
  await getClaimInsuredModel().destroy({
    where: {
      claimId: {
        [Op.in]: claimIds,
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
  ctx.url = `http://${hostname}:${port}/v1.0/claims`;
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

  // 断开Redis连接
  await getRedis().end();
});

// 测试逻辑
describe('申请理赔接口', () => {
  test('当理赔申请成功时，应得到理赔单号', async () => {
    // 1. 配置
    let policy = null;
    let applicant = null;
    let insured = null;
    let bodyStr = '';
    let authStr = '';
    {
      // 获取随机的保障期间
      const { effectiveTime, expiryTime } = getRandomPeriod();
      // 生成随机证件信息
      const { idType, idNo } = getRandomId();
      // 获取随机联系号码
      const contactNo = getRandomContactNo();

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
      applicant = await getApplicantModel().create({
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
      insured = await getInsuredModel().create({
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

      // 请求体
      bodyStr = JSON.stringify({
        policyNo: policy.policyNo,
        insureds: [
          {
            no: insured.no,
            relationship: insured.relationship,
            name: insured.name,
            idType: insured.idType,
            idNo: insured.idNo,
            gender: insured.gender,
            birth: insured.birth,
          },
        ],
      });
      // 鉴权信息
      authStr = getAuthorization(ctx.url, bodyStr, ctx.secretId, ctx.secretKey);
    }

    // 2. 执行
    const rst = await ctx.axiosClient.request({
      data: bodyStr,
      headers: { authorization: authStr },
    });

    // 3. 断言
    expect(rst).toMatchObject({
      status: 200,
      data: {
        claimNo: expect.stringMatching(/^[a-zA-Z0-9]*$/),
        policyNo: policy.policyNo,
        status: expect.any(String),
      },
    });
    rst.data.insureds.forEach((ins) => {
      expect(ins).toMatchObject({
        no: insured.no,
        relationship: insured.relationship,
        name: insured.name,
        idType: insured.idType,
        idNo: insured.idNo,
        gender: insured.gender,
      });
    });
  });
});
