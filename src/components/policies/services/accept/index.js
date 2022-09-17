const Joi = require('joi');
const { error400, error500 } = require('../../../../libraries/utils');
const dao = require('../../dao');
const basalSchema = require('./schemas/basal');

/**
 * 执行基本校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} profile 身份数据
 */
const basalValidation = async (ctx, reqData, profile) => {
  // 字段校验
  const { error, value } = Joi.object(basalSchema).validate({
    orderNo: reqData.orderNo || undefined,
    contractCode: reqData.contractCode || undefined,
    contractVersion: reqData.contractVersion || undefined,
    planCode: reqData.planCode || undefined,
  });
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

const bizValidation = async () => {};
const charging = async () => {};
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
