/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const uuid = require('uuid');
const moment = require('moment');
const { getRedis } = require('../../../../src/libraries/redis');
const { getBizConfig } = require('../../../../src/libraries/biz-config');
const { getRandomNum } = require('../../../../src/libraries/utils');
const { aesEncrypt } = require('../../../../src/libraries/crypto');
const {
  getRandomPeriod,
  getRandomName,
  getRandomId,
  getRandomGender,
  getRandomBirth,
  getRandomContactNo,
  getRandomRelationship,
  getSecretModel,
} = require('./utils');
const {
  getPolicyModel,
  getApplicantModel,
  getInsuredModel,
  getProducerModel,
  getProductModel,
  getPlanModel,
  getContractModel,
  getClaimModel,
  getClaimInsuredModel,
} = require('../../../../src/models');

/**
 * 判断当前是否首次执行
 * @param {object} ctx 上下文变量
 */
const isFirstRun = async (ctx) => {
  const key = 'gen-base-datas';
  const setRst = await getRedis().setnx(key, '1');
  ctx.isFirstRun = setRst === 1;
};

/**
 * 创建依赖数据（渠道、契约、产品和计划等）
 * 非首次执行则不创建
 * @param {object} ctx 上下文变量
 */
const genDependencies = async (ctx) => {
  // 创建销售渠道
  if (ctx.isFirstRun) {
    await getProducerModel().create({
      name: '销售渠道(基础依赖数据)',
      code: 'PC-BASE',
    });
  }

  // 查询渠道
  ctx.producer = await getProducerModel().findOne({
    where: { code: 'PC-BASE' },
  });

  // 创建密钥
  await getSecretModel().create({
    secretId: 'd73d0a29-0bea-42e5-a8a6-211bb998f8b5',
    secretKey: aesEncrypt('n8Ih%mA9PL^X)%MN2e%cO(9=Uhczf7n+'),
    producerId: ctx.producer.id,
  });

  // 创建保险产品
  if (ctx.isFirstRun) {
    await getProductModel().create({
      name: '保险产品(基础依赖数据)',
      code: 'PD-BASE',
      version: 1,
    });
  }

  // 查询保险产品
  ctx.product = await getProductModel().findOne({
    where: { code: 'PD-BASE' },
  });

  // 创建保险计划
  if (ctx.isFirstRun) {
    await getPlanModel().create({
      name: '保险计划(基础依赖数据)',
      code: 'PL-BASE',
      version: 1,
      productId: ctx.product.id,
    });
  }

  // 查询保险计划
  ctx.plan = await getPlanModel().findOne({
    where: { code: 'PL-BASE' },
  });

  // 创建授权契约
  if (ctx.isFirstRun) {
    await getContractModel().create({
      code: 'C-BASE',
      version: 1,
      producerId: ctx.producer.id,
      productId: ctx.product.id,
      productVersion: ctx.product.version,
    });
  }

  // 查询授权契约
  ctx.contract = await getContractModel().findOne({
    where: { code: 'C-BASE' },
  });

  // 获取业务规则配置
  ctx.bizConfig = await getBizConfig({
    product: ctx.product,
    plan: ctx.plan,
    producer: ctx.producer,
    contract: ctx.contract,
  });

  console.log('依赖数据准备就绪');
};

/**
 * 识别需构造的数量以及每批次的大小
 * @param {object} ctx 上下文变量
 */
const genQtyConfig = async (ctx) => {
  // 目标总保单数
  const total = 8000000;

  // 已有保单数
  const exists = await getPolicyModel().count();
  console.log(`已存在 ${exists} 张保单`);

  // 仍需构造的保单数
  ctx.alsoNeed = total - exists;
  console.log(`仍需构造 ${ctx.alsoNeed} 张保单`);

  // 每批构造的保单数量
  ctx.bulkSize = 500;
  console.log(`每批构造 ${ctx.bulkSize} 张保单`);
};

/**
 * 构造保单数据
 * @param {object} ctx 上下文变量
 * @returns {array}
 */
const genPolicyDatas = async (ctx) => {
  const policyDatas = [];
  for (let i = 0; i < ctx.bulkSize; i += 1) {
    // 生成保单号
    const incr = await getRedis().incr('policy-no-incr');
    const date = moment().format('YYYYMMDD');
    const incrStr = `${incr}`.padStart(8, '0');
    const policyNo = `FOOINS${date}${incrStr}`;

    // 获取随机的保障期间
    const { effectiveTime, expiryTime } = getRandomPeriod();

    policyDatas.push({
      policyNo,
      effectiveTime,
      expiryTime,
      orderNo: uuid.v4(),
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
  }
  return policyDatas;
};

/**
 * 构造投保人数据
 * @param {object} ctx 上下文变量
 * @param {array} policies 保单数据
 * @returns {array}
 */
const genApplicantDatas = async (ctx, policies) => {
  const applicantsDatas = [];
  for (let i = 0; i < policies.length; i += 1) {
    const policy = policies[i];

    // 生成随机证件信息
    const { idType, idNo } = getRandomId();

    // 获取随机联系号码
    const contactNo = getRandomContactNo();

    applicantsDatas.push({
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
  }
  return applicantsDatas;
};

/**
 * 构造被保险人数据
 * @param {object} ctx 上下文变量
 * @param {array} policies 保单数据
 * @returns {array}
 */
const genInsuredDatas = async (ctx, policies) => {
  const insuredsDatas = [];
  for (let i = 0; i < policies.length; i += 1) {
    const policy = policies[i];

    for (let j = 0; j < getRandomNum(1, 3); j += 1) {
      // 生成随机证件信息
      const { idType, idNo } = getRandomId();

      // 获取随机联系号码
      const contactNo = getRandomContactNo();

      insuredsDatas.push({
        idType,
        idNo,
        contactNo,
        no: uuid.v4(),
        policyId: policy.id,
        name: getRandomName(),
        gender: getRandomGender(),
        birth: getRandomBirth(),
        email: `${contactNo}@qq.com`,
        premium: getRandomNum(1, 1000),
        relationship: getRandomRelationship(),
      });
    }
  }

  return insuredsDatas;
};

/**
 * 构造理赔单数据
 * @param {object} ctx 上下文变量
 * @param {array} policies 保单
 * @returns {array}
 */
const genClaimDatas = async (ctx, policies) => {
  const claimDatas = [];
  for (let i = 0; i < policies.length; i += 1) {
    const policy = policies[i];

    if (getRandomNum(0, 1) === 1) {
      // 生成理赔单号
      const incr = await getRedis().incr('claim-no-incr');
      const date = moment().format('YYYYMMDD');
      const incrStr = `${incr}`.padStart(6, '0');
      const claimNo = `CLAIMS${date}${incrStr}`;

      claimDatas.push({
        claimNo,
        policyId: policy.id,
        producerId: ctx.producer.id,
        sumInsured: getRandomNum(1000, 10000),
        status: 'paid',
        bizConfig: JSON.stringify(ctx.bizConfig.claim),
      });
    }
  }
  return claimDatas;
};

/**
 * 构造理赔被保险人数据
 * @param {object} ctx 上下文变量
 * @param {array} claims 理赔单
 * @param {array} insureds 保单的被保险人
 */
const genClaimInsuredDatas = async (ctx, claims, insureds) => {
  const claimInsuredDatas = [];
  for (let i = 0; i < claims.length; i += 1) {
    const { id: claimId, policyId } = claims[i];

    // 匹配被保险人
    const policyInsureds = insureds.filter((ins) => ins.policyId === policyId);

    for (let j = 0; j < getRandomNum(1, policyInsureds.length - 1); j += 1) {
      claimInsuredDatas.push({
        claimId,
        no: policyInsureds[j].no,
      });
    }
  }
  return claimInsuredDatas;
};

/**
 * 执行数据构造
 */
const gen = async () => {
  // 定义一个上下文变量
  const ctx = {};

  // 当前是否首次执行
  await isFirstRun(ctx);

  // 创建依赖数据（渠道、契约、产品和计划等）
  // 非首次执行则不创建
  await genDependencies(ctx);

  // 识别需构造的数量以及每批次的大小
  await genQtyConfig(ctx);

  // 批量构造
  for (let i = 0; i < ctx.alsoNeed; i += ctx.bulkSize) {
    // 构造保单数据
    const policyDatas = await genPolicyDatas(ctx);
    const policies = await getPolicyModel().bulkCreate(policyDatas);

    // 构造投保人数据
    const applicantsDatas = await genApplicantDatas(ctx, policies);
    await getApplicantModel().bulkCreate(applicantsDatas);

    // 构造被保险人数据
    const insuredsDatas = await genInsuredDatas(ctx, policies);
    const insureds = await getInsuredModel().bulkCreate(insuredsDatas);

    // 构造理赔单
    const claimDatas = await genClaimDatas(ctx, policies);
    if (claimDatas.length) {
      const claims = await getClaimModel().bulkCreate(claimDatas);

      // 构造理赔被保险人
      const claimInsuredDatas = await genClaimInsuredDatas(
        ctx,
        claims,
        insureds,
      );
      await getClaimInsuredModel().bulkCreate(claimInsuredDatas);
    }

    console.log(
      `成功构造 ${policies.length} 张保单，${claimDatas.length} 张理赔单`,
    );
  }
};

gen()
  .then(() => {
    console.info('基础数据构造成功');
  })
  .catch((error) => {
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
