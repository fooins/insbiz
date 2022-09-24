const moment = require('moment');
const dao = require('../dao');
const formulas = require('../../../libraries/formulas');
const { validatePolicyNo } = require('./get');
const {
  error400,
  error403,
  error404,
  error500,
  hasOwnProperty,
} = require('../../../libraries/utils');

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
 * 执行校验
 * @param {object} ctx 上下文对象
 */
const validation = async (ctx) => {
  const { policy } = ctx;
  const { cancel } = policy.bizConfigParsed;
  const { allowEffective, allowExpired } = cancel.period;

  // 是否允许退保
  if (!cancel.allowCancel) throw error400('该保单不允许退保');

  // 不允许有效期内退保
  if (!allowEffective) {
    if (moment(policy.effectiveTime).isBefore(moment())) {
      throw error400('不允许有效期内退保');
    }
  }

  // 不允许失效保单退保
  if (!allowExpired) {
    if (moment(policy.expiryTime).isBefore(moment())) {
      throw error400('不允许失效保单退保');
    }
  }
};

/**
 * 生成批单数据
 * @param {object} ctx 上下文对象
 */
const generateEndorsementData = async (ctx) => {
  const { policy } = ctx;

  const endorsementData = {
    policyId: policy.id,
    type: 'cancel',
    details: [],
  };
  const newPolicyData = {
    applicants: [],
    insureds: [],
  };

  ctx.endorsementData = endorsementData;
  ctx.newPolicyData = newPolicyData;
};

/**
 * 计费
 * @param {object} ctx 上下文对象
 */
const charging = async (ctx) => {
  const { policy, newPolicyData, endorsementData } = ctx;
  const { cancel } = policy.bizConfigParsed;
  const { calculateMode, formula } = cancel.premium;

  // 计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](ctx, 'cancel', params);
  }

  // 校验
  let totalPremium = 0;
  newPolicyData.insureds.forEach((insured) => {
    totalPremium += insured.premium;
  });
  if (totalPremium !== newPolicyData.premium) {
    throw error500(`计费错误，被保险人总保费不等于保单保费`);
  }

  // 生成数据
  endorsementData.difference = newPolicyData.premium - policy.premium;
  if (endorsementData.difference !== 0) {
    endorsementData.details.push({
      type: 'policy',
      field: 'premium',
      original: policy.premium,
      current: newPolicyData.premium,
    });
  }
  newPolicyData.insureds.forEach((insured) => {
    const oriInsured = policy.insureds.find((i) => i.no === insured.no);
    if (insured.premium !== oriInsured.premium) {
      endorsementData.details.push({
        type: 'insured',
        field: 'premium',
        original: oriInsured.premium,
        current: insured.premium,
        targetNo: insured.no,
      });
    }
  });
};

/**
 * 生成批单号
 * @param {object} ctx 上下文对象
 */
const generateEndorseNo = async (ctx) => {
  const { policy, newPolicyData, endorsementData } = ctx;
  endorsementData.endorseNo = `${parseInt(policy.endorseNo, 10) + 1}`.padStart(
    3,
    '0',
  );
  newPolicyData.endorseNo = endorsementData.endorseNo;
};

/**
 * 保存数据
 * @param {object} ctx 上下文对象
 */
const saveEndorsementData = async (ctx) => {
  const { endorsementData, policy, newPolicyData } = ctx;

  // 组装保存的数据
  const saveData = {
    endorsementData,
    newPolicyData,
    policySnapshootData: {
      policyId: policy.id,
      content: JSON.stringify({
        ...policy.dataValues,
        applicants: policy.applicants.map((applicant) => applicant.dataValues),
        insureds: policy.insureds.map((insured) => insured.dataValues),
      }),
    },
  };

  // 保存批单

  ctx.dataSaved = await dao.saveEndorsement(saveData);
};

/**
 * 组装响应数据
 * @param {object} ctx 上下文对象
 */
const assembleResponseData = async (ctx) => {
  const { dataSaved, policy } = ctx;
  const { endorsement } = dataSaved;

  return {
    policyNo: policy.policyNo,
    endorseNo: endorsement.endorseNo,
    difference: endorsement.difference,
  };
};

/**
 * 退保
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const cancellation = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 查询保单
  await getPolicy(ctx, reqData, profile);

  // 执行校验
  await validation(ctx);

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
  cancellation,
};
