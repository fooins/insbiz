const Joi = require('joi');
const _ = require('lodash');
const {
  error400,
  error500,
  hasOwnProperty,
} = require('../../../../libraries/utils');
const { getBizConfig } = require('../../../../libraries/biz-config');
const dao = require('../../dao');
const formulas = require('./formulas');
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
  const { accept: bizConfig } = await getBizConfig({
    product,
    plan,
    producer,
    contract,
  });
  ctx.bizConfig = bizConfig;

  // 根据业务规则配置获取对应的校验模式
  const bizSchema = getBizSchema(bizConfig);

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
  adjustPolicyData(ctx, bizConfig);

  // 根据业务规则配置获取对应的校验模式
  // 针对调整后的保单数据
  const bizSchemaForAdjusted = getBizSchemaForAdjusted(policyData, bizConfig);

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
  const { calculateMode, formula, minimum, maximum } = bizConfig.premium;

  // 计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](ctx, params);
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

const generatePolicyNumber = async () => {};
const savePolicyData = async () => {};
const assembleResponseData = async () => {};

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
  await generatePolicyNumber(ctx);

  // 保存数据
  await savePolicyData(ctx);

  // 组装响应数据
  const responseData = await assembleResponseData(ctx);

  return responseData;
};

module.exports = {
  acceptInsurance,
};
