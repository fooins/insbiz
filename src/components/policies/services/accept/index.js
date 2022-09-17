const Joi = require('joi');
const { error400, error500 } = require('../../../../libraries/utils');
const dao = require('../../dao');
const basalSchema = require('./schemas/basal');

/**
 * 执行基本校验
 * @param {object} reqData 请求数据
 * @param {object} profile 身份数据
 * @returns {object} 上下文
 */
const basalValidation = async (reqData, profile) => {
  // 上下文对象
  const context = {};

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
    context.policyData = {
      orderNo: value.orderNo,
      contractCode: value.contractCode,
      contractVersion: value.contractVersion,
      planCode: value.planCode,
    };
  }

  // 查询销售渠道
  const producer = await dao.getProducerByCode(profile.producer.code);
  if (!producer) throw error500('获取销售渠道信息失败');
  context.producer = producer;

  // 检查订单号
  const exists = await dao.getPolicyByOrderNo(
    context.policyData.orderNo,
    producer.id,
    {
      attributes: ['id'],
    },
  );
  if (exists) throw error400('订单号已存在', { target: 'orderNo' });

  // 检查契约
  const contract = await dao.getContractByCode(
    context.policyData.contractCode,
    context.policyData.contractVersion,
    { includeProduct: true },
  );
  if (!contract) {
    throw error400('契约不存在');
  } else {
    context.contract = contract;
    context.product = contract.Product;
  }
  if (contract.producerId !== producer.id) throw error400('契约不属于当前渠道');

  // 检查计划
  const plan = await dao.getPlanByCode(
    context.policyData.planCode,
    context.product.version,
  );
  if (!plan) {
    throw error400('保险产品计划不存在');
  } else {
    context.plan = plan;
  }
  if (plan.productId !== context.product.id) {
    throw error400('计划不属于当前保险产品');
  }

  return context;
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
  // 基础校验
  const context = await basalValidation(reqData, profile);

  // 业务规则校验
  await bizValidation(context, reqData);

  // 计费
  await charging(context);

  // 生成保单号
  await generatePolicyNumber(context);

  // 保存数据
  await savePolicyData(context);

  // 组装响应数据
  const responseData = await assembleResponseData(context);

  return responseData;
};

module.exports = {
  acceptInsurance,
};
