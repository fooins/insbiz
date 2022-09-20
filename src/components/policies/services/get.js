const Joi = require('joi');
const dao = require('../dao');
const { error400, error403 } = require('../../../libraries/utils');

/**
 * 校验保单号
 *
 * @param {object|string} data 待校验的数据
 *   可以是字符串类型的保单号
 *   也可以是对象类型，包含保单号字段“policyNo”
 *
 * @returns {string} 保单号
 */
const validatePolicyNo = (data) => {
  // 保单号校验策略
  const policyNoSchema = Joi.string()
    .max(64)
    .pattern(/^[a-zA-Z0-9_]*$/)
    .required();

  // 最终的校验策略
  const schema =
    typeof data === 'object'
      ? Joi.object({
          policyNo: policyNoSchema,
        })
      : policyNoSchema;

  // 校验
  const { error, value } = schema.validate(data, {
    allowUnknown: true,
    stripUnknown: true,
  });
  if (error) {
    throw error400(error.message, {
      target: 'policyNo',
      cause: error,
    });
  }

  return typeof value === 'object' ? value.policyNo : value;
};

/**
 * 查询保单（单个）
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const getPolicy = async (reqData, profile) => {
  // 校验保单号
  const policyNo = validatePolicyNo(reqData);

  // 查询保单
  const { producer } = profile;
  const policy = await dao.getPolicyByNo(policyNo, {
    attributes: { exclude: ['bizConfig'] },
    includeContract: {
      attributes: ['code', 'version'],
    },
    includeProduct: {
      attributes: ['code', 'version'],
    },
    includePlan: {
      attributes: ['code', 'version'],
    },
    queryApplicants: true,
    queryInsureds: true,
  });
  if (policy.producerId !== producer.id) throw error403();

  // 响应数据
  const { Contract, Product, Plan, applicants, insureds } = policy;
  return {
    orderNo: policy.orderNo,
    policyNo: policy.policyNo,
    contractCode: Contract.code,
    contractVersion: Contract.version,
    productCode: Product.code,
    productVersion: Product.version,
    planCode: Plan.code,
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

module.exports = {
  getPolicy,
  validatePolicyNo,
};
