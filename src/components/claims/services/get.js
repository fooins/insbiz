const Joi = require('joi');
const dao = require('../dao');
const { error400, error403, error404 } = require('../../../libraries/utils');

/**
 * 校验理赔单号
 * @param {object} data 待校验的数据
 * @returns {string} 理赔单号
 */
const validateClaimNo = (data) => {
  const { error, value } = Joi.object({
    claimNo: Joi.string()
      .max(64)
      .pattern(/^[a-zA-Z0-9]*$/)
      .required(),
  }).validate(data, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw error400(error.message, {
      target: 'claimNo',
      cause: error,
    });
  }

  return value.claimNo;
};

/**
 * 查询理赔单（单个）
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const getClaim = async (reqData, profile) => {
  // 校验理赔单号
  const claimNo = validateClaimNo(reqData);

  // 查询理赔单
  const { producer } = profile;
  const claim = await dao.getClaimByNo(claimNo, {
    queryInsureds: true,
    includePolicy: {
      attributes: ['policyNo'],
    },
  });
  if (!claim) throw error404('理赔单不存在');
  if (claim.producerId !== producer.id) throw error403();

  // 响应数据
  const { insureds, Policy } = claim;
  return {
    claimNo: claim.claimNo,
    policyNo: Policy.policyNo,
    status: claim.status,
    insureds: insureds.map((insured) => ({
      no: insured.no || undefined,
      relationship: insured.relationship || undefined,
      name: insured.name || undefined,
      idType: insured.idType || undefined,
      idNo: insured.idNo || undefined,
      gender: insured.gender || undefined,
      birth: insured.birth || undefined,
      contactNo: insured.contactNo || undefined,
      email: insured.email || undefined,
    })),
  };
};

module.exports = {
  getClaim,
};
