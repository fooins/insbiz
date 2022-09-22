const Joi = require('joi');
const dao = require('../../dao');
const { error400, error403, error404 } = require('../../../../libraries/utils');

/**
 * 校验保单号
 * @param {object} data 待校验的数据
 * @returns {string} 保单号
 */
const validatePolicyNo = (data) => {
  const { error, value } = Joi.object({
    policyNo: Joi.string()
      .max(64)
      .pattern(/^[a-zA-Z0-9\\-]*$/)
      .required(),
  }).validate(data, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw error400(error.message, {
      target: 'policyNo',
      cause: error,
    });
  }

  return value.policyNo;
};

/**
 * 查询保单
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} profile 身份数据
 */
const getPolicy = async (ctx, reqData, profile) => {
  // 校验保单号
  const policyNo = validatePolicyNo(reqData);

  // 查询保单
  const { producer } = profile;
  const policy = await dao.getPolicyByNo(policyNo, {
    parseBizConfig: true,
    queryApplicants: true,
    queryInsureds: true,
  });
  if (!policy) throw error404('保单不存在');
  if (policy.producerId !== producer.id) throw error403();

  ctx.policy = policy;
};

/**
 * 业务规则校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 */
const bizValidation = async () => {};

const generateEndorsementData = async () => {};
const charging = async () => {};
const generateEndorseNo = async () => {};
const saveEndorsementData = async () => {};
const assembleResponseData = async () => {};

/**
 * 批改保单
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const endorse = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 查询保单
  await getPolicy(ctx, reqData, profile);

  // 业务规则校验
  await bizValidation(ctx, reqData);

  // 生成批单数据
  await generateEndorsementData(ctx);

  // 计费
  await charging(ctx);

  // 生成批单号
  await generateEndorseNo(ctx);

  // 保存数据
  await saveEndorsementData(ctx);

  // 组装响应数据
  const responseData = assembleResponseData(ctx);

  return responseData;
};

module.exports = {
  endorse,
};
