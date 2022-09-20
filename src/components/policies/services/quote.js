const { basalValidation, bizValidation, charging } = require('./accept');

/**
 * 组装响应数据
 * @param {object} ctx 上下文对象
 */
const assembleResponseData = (ctx) => {
  const { policyData } = ctx;

  return {
    contractCode: policyData.contractCode,
    contractVersion: policyData.contractVersion,
    productCode: policyData.productCode,
    productVersion: policyData.productVersion,
    planCode: policyData.planCode,
    effectiveTime: policyData.effectiveTime,
    expiryTime: policyData.expiryTime,
    premium: policyData.premium,
    insureds: policyData.insureds.map((insured) => ({
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
 * 报价
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const quotation = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 基础校验
  await basalValidation(ctx, reqData, profile);

  // 业务规则校验
  await bizValidation(ctx, reqData);

  // 计费
  await charging(ctx);

  // 组装响应数据
  const responseData = assembleResponseData(ctx);

  return responseData;
};

module.exports = {
  quotation,
};
