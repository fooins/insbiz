const dao = require('./dao');
const basalSchema = require('./schemas/accept-insurance-basal');
const { error400, error500 } = require('../../libraries/utils');

/**
 * 执行基本校验
 * @param {object} reqData 请求数据
 * @param {object} profile 身份数据
 * @returns {object}
 */
const basalValidation = async (reqData, profile) => {
  const context = {}; // 保留上下文信息
  const policyData = {}; // 校验通过的保单数据

  // 字段校验
  const { error, value } = basalSchema.validate(reqData, {
    allowUnknown: true,
    stripUnknown: true,
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
    policyData.orderNo = value.orderNo;
    policyData.contractCode = value.contractCode;
    policyData.contractVersion = value.contractVersion;
  }

  // 查询销售渠道
  const producer = await dao.getProducerByCode(profile.producer.code);
  if (!producer) throw error500('获取销售渠道信息失败');
  else context.producer = producer;

  // 检查订单号
  const exists = await dao.getPolicyByOrderNo(policyData.orderNo, producer.id, {
    attributes: ['id'],
  });
  if (exists) throw error400('订单号已存在', { target: 'orderNo' });

  // 检查契约
  const contract = await dao.getContractByCode(
    policyData.contractCode,
    policyData.contractVersion,
    { includeProduct: true },
  );
  if (!contract) {
    throw error400('契约不存在');
  } else {
    context.contract = contract;
    context.product = contract.Product;
  }
  if (contract.producerId !== producer.id) throw error400('契约不属于当前渠道');

  return { context, policyData };
};

/**
 * 承保
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object}
 */
const acceptInsurance = async (reqData, profile) => {
  // 基础校验
  const { context, policyData } = await basalValidation(reqData, profile);

  return {
    context,
    policyData,
  };
};

module.exports = {
  acceptInsurance,
};
