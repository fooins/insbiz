const Joi = require('joi');
const moment = require('moment');
const _ = require('lodash');
const {
  error400,
  error500,
  hasOwnProperty,
} = require('../../../../libraries/utils');
const { getBizConfig } = require('../../../../libraries/biz-config');
const { getRedis } = require('../../../../libraries/redis');
const dao = require('../../dao');
const formulas = require('../../../../libraries/formulas');
const { getBizSchema, getBizSchemaForAdjusted } = require('./biz-schema');
const { adjustPolicyData } = require('./policy-data');

/**
 * 执行基本校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} profile 身份数据
 */
const basalValidation = async (ctx, reqData, profile) => {
  // 组装待校验的数据
  const data = {};
  if (reqData.orderNo) data.orderNo = reqData.orderNo;
  if (reqData.contractCode) data.contractCode = reqData.contractCode;
  if (reqData.contractVersion) data.contractVersion = reqData.contractVersion;
  if (reqData.planCode) data.planCode = reqData.planCode;

  // 校验策略
  const schema = Joi.object({
    orderNo: Joi.string()
      .max(64)
      .pattern(/^[a-zA-Z0-9_]*$/)
      .required(),
    contractCode: Joi.string().required(),
    contractVersion: Joi.string(),
    planCode: Joi.string().required(),
  });

  // 字段校验
  const { error, value } = schema.validate(data);
  if (error) {
    const {
      details: [{ path }],
    } = error;

    throw error400(error.message, {
      target: path && path[0],
      cause: error,
    });
  } else {
    ctx.policyData = {
      orderNo: value.orderNo,
      contractCode: value.contractCode,
      contractVersion: value.contractVersion,
      planCode: value.planCode,
    };
  }

  // 查询销售渠道
  const producer = await dao.getProducerByCode(profile.producer.code);
  if (!producer) throw error500('获取销售渠道信息失败');
  ctx.producer = producer;

  // 检查订单号
  const exists = await dao.getPolicyByOrderNo(
    ctx.policyData.orderNo,
    producer.id,
    {
      attributes: ['id'],
    },
  );
  if (exists) throw error400('订单号已存在', { target: 'orderNo' });

  // 检查契约
  const contract = await dao.getContractByCode(
    ctx.policyData.contractCode,
    ctx.policyData.contractVersion,
    { includeProduct: true },
  );
  if (!contract) {
    throw error400('契约不存在');
  } else {
    ctx.contract = contract;
    ctx.product = contract.Product;
  }
  if (contract.producerId !== producer.id) throw error400('契约不属于当前渠道');

  // 检查计划
  const plan = await dao.getPlanByCode(
    ctx.policyData.planCode,
    ctx.product.version,
  );
  if (!plan) {
    throw error400('保险产品计划不存在');
  } else {
    ctx.plan = plan;
  }
  if (plan.productId !== ctx.product.id) {
    throw error400('计划不属于当前保险产品');
  }
};

/**
 * 执行业务规则校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 */
const bizValidation = async (ctx, reqData) => {
  const { product, plan, producer, contract, policyData } = ctx;

  // 剔除非业务规则相关的参数
  const reqDataBiz = { ...reqData };
  delete reqDataBiz.orderNo;
  delete reqDataBiz.contractCode;
  delete reqDataBiz.contractVersion;
  delete reqDataBiz.planCode;

  // 获取业务规则配置
  const bizConfig = await getBizConfig({
    product,
    plan,
    producer,
    contract,
  });
  const acceptBizConfig = bizConfig.accept;
  ctx.bizConfig = bizConfig;

  // 根据业务规则配置获取对应的校验模式
  const bizSchema = getBizSchema(acceptBizConfig);

  // 执行业务规则校验
  const { error, value } = bizSchema.validate(reqDataBiz);
  if (error) {
    const {
      details: [{ path }],
    } = error;

    throw error400(error.message, {
      target: path && path[0],
      cause: error,
    });
  } else {
    ctx.policyData = _.merge(policyData, value);
  }

  // 根据业务规则调整保单数据
  adjustPolicyData(ctx, acceptBizConfig);

  // 根据业务规则配置获取对应的校验模式
  // 针对调整后的保单数据
  const bizSchemaForAdjusted = getBizSchemaForAdjusted(
    policyData,
    acceptBizConfig,
  );

  // 执行业务规则校验
  // 针对调整后的保单数据
  const { error: err } = bizSchemaForAdjusted.validate(policyData, {
    allowUnknown: true,
    stripUnknown: true,
  });
  if (err) {
    const {
      details: [{ path }],
    } = err;

    throw error400(err.message, {
      target: path && path[0],
      cause: err,
    });
  }
};

/**
 * 计算保费
 * @param {object} ctx 上下文对象
 */
const charging = async (ctx) => {
  const { bizConfig, policyData } = ctx;
  const { calculateMode, formula, minimum, maximum } = bizConfig.accept.premium;

  // 计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](ctx, 'accept', params);
  }

  // 校验
  let totalPremium = 0;
  policyData.insureds.forEach((insured) => {
    totalPremium += insured.premium;
  });
  if (totalPremium !== policyData.premium) {
    if (calculateMode === 'adoptClient') {
      throw error400(`被保险人总保费不等于保单保费`);
    } else {
      throw error500(`被保险人总保费不等于保单保费`);
    }
  }
  if (policyData.premium < minimum) {
    throw error400(`保费不允许小于 ${minimum} 元`, {
      target: 'premium',
    });
  }
  if (policyData.premium > maximum) {
    throw error400(`保费不允许大于 ${maximum} 元`, {
      target: 'premium',
    });
  }
};

/**
 * 生成保单号
 * @param {object} ctx 上下文对象
 */
const generatePolicyNo = async (ctx) => {
  // 获取自增序号
  const incr = await getRedis().incr('policy-no-incr');

  // 生成保单号
  const date = moment().format('YYYYMMDD');
  const incrStr = `${incr}`.padStart(8, '0');
  const policyNo = `FOOINS${date}${incrStr}`;

  ctx.policyData.policyNo = policyNo;
  ctx.policyData.boundTime = moment().toISOString(true);
};

/**
 * 保存保单数据
 * @param {object} ctx 上下文对象
 */
const savePolicyData = async (ctx) => {
  const { policyData, producer, contract, product, plan, bizConfig } = ctx;

  // 组装保存的数据
  const saveData = { ...policyData };
  saveData.producerId = producer.id;
  saveData.contractId = contract.id;
  saveData.productId = product.id;
  saveData.productVersion = product.version;
  saveData.planId = plan.id;
  saveData.bizConfig = JSON.stringify(bizConfig);

  // 保存保单
  ctx.policyDataSaved = await dao.savePolicy(saveData);
};

/**
 * 组装响应数据
 * @param {object} ctx 上下文对象
 */
const assembleResponseData = (ctx) => {
  const { policyDataSaved, policyData } = ctx;
  const { policy, applicants, insureds } = policyDataSaved;

  return {
    orderNo: policy.orderNo,
    policyNo: policy.policyNo,
    contractCode: policyData.contractCode,
    contractVersion: policyData.contractVersion,
    productCode: policyData.productCode,
    productVersion: policyData.productVersion,
    planCode: policyData.planCode,
    effectiveTime: policy.effectiveTime,
    expiryTime: policy.expiryTime,
    boundTime: policy.boundTime,
    premium: policy.premium,
    applicants: applicants.map((applicant) => ({
      no: applicant.no,
      name: applicant.name,
      idType: applicant.idType,
      idNo: applicant.idNo,
      gender: applicant.gender,
      birth: applicant.birth,
      contactNo: applicant.contactNo,
      email: applicant.email,
    })),
    insureds: insureds.map((insured) => ({
      no: insured.no,
      relationship: insured.relationship,
      name: insured.name,
      idType: insured.idType,
      idNo: insured.idNo,
      gender: insured.gender,
      birth: insured.birth,
      contactNo: insured.contactNo,
      email: insured.email,
      premium: insured.premium,
    })),
  };
};

/**
 * 承保
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const acceptInsurance = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 基础校验
  await basalValidation(ctx, reqData, profile);

  // 业务规则校验
  await bizValidation(ctx, reqData);

  // 计费
  await charging(ctx);

  // 生成保单号
  await generatePolicyNo(ctx);

  // 保存数据
  await savePolicyData(ctx);

  // 组装响应数据
  const responseData = assembleResponseData(ctx);

  return responseData;
};

module.exports = {
  acceptInsurance,
  basalValidation,
  bizValidation,
  charging,
};
