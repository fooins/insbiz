const moment = require('moment');
const uuid = require('uuid');
const dao = require('../dao');
const { validatePolicyNo } = require('./get');
const {
  error404,
  error403,
  error400,
  error500,
  hasOwnProperty,
} = require('../../../libraries/utils');
const formulas = require('../../../libraries/formulas');

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
    includeContract: {
      attributes: ['code'],
    },
    includeProduct: {
      attributes: ['code'],
    },
    includePlan: {
      attributes: ['code'],
    },
    parseBizConfig: true,
    queryApplicants: true,
    queryInsureds: true,
  });
  if (!policy) throw error404('保单不存在');
  if (policy.producerId !== producer.id) throw error403();

  ctx.policy = policy;
};

/**
 * 根据业务规则生成新的保单数据
 * @param {object} ctx 上下文对象
 */
const generateNewPolicyData = async (ctx) => {
  const { policy } = ctx;
  const { renew } = policy.bizConfigParsed;
  const { allowRenew, period, premium } = renew;

  // 是否允许续保
  if (!allowRenew) throw error400('该保单不允许续保');

  // 初始化新保单数据
  const newPolicyData = {
    orderNo: uuid.v4(),
    producerId: policy.producerId,
    contractId: policy.contractId,
    contractVersion: policy.contractVersion,
    productId: policy.productId,
    productVersion: policy.productVersion,
    planId: policy.planId,
    bizConfig: policy.bizConfig,
    premium: policy.premium,
    applicants: policy.applicants.map((applicant) => ({
      name: applicant.name,
      idType: applicant.idType,
      idNo: applicant.idNo,
      gender: applicant.gender,
      birth: applicant.birth,
      contactNo: applicant.contactNo,
      email: applicant.email,
    })),
    insureds: policy.insureds.map((insured) => ({
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

  // 保障期间
  if (period.mode === 'continue') {
    newPolicyData.effectiveTime = moment(policy.expiryTime)
      .add(1, 'second')
      .toISOString(true);

    newPolicyData.expiryTime = moment(newPolicyData.effectiveTime)
      .add(
        moment(policy.expiryTime).diff(
          moment(policy.effectiveTime),
          'millisecond',
        ),
        'millisecond',
      )
      .toISOString(true);
  }

  // 保费
  if (premium.calculateMode === 'fixed') {
    let totalPremium = 0;
    newPolicyData.insureds.forEach((insureds, idx) => {
      newPolicyData.insureds[idx].premium = parseFloat(premium.fixed);
      totalPremium += parseFloat(premium.fixed);
    });
    newPolicyData.premium = totalPremium;
  }

  ctx.newPolicyData = newPolicyData;
};

/**
 * 计算保费
 * @param {object} ctx 上下文对象
 */
const charging = async (ctx) => {
  const { newPolicyData, policy } = ctx;
  const { renew } = policy.bizConfigParsed;
  const { calculateMode, formula, minimum, maximum } = renew.premium;

  // 重新计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](ctx, 'renew', params);
  }

  // 校验
  let totalPremium = 0;
  newPolicyData.insureds.forEach((insured) => {
    totalPremium += insured.premium;
  });
  if (totalPremium !== newPolicyData.premium) {
    throw error500(`被保险人总保费不等于保单保费`);
  }
  if (newPolicyData.premium < minimum) {
    throw error500(`保费不允许小于 ${minimum} 元`);
  }
  if (newPolicyData.premium > maximum) {
    throw error500(`保费不允许大于 ${maximum} 元`);
  }
};

/**
 * 生成保单号
 * @param {object} ctx 上下文对象
 */
const generatePolicyNo = async (ctx) => {
  const { newPolicyData, policy } = ctx;

  // 解析原保单号
  const policyNoSeg = `${policy.policyNo}`.split('-');
  if (!policyNoSeg[1]) policyNoSeg[1] = '00';

  // 递增续保号
  policyNoSeg[1] = `${parseInt(policyNoSeg[1], 10) + 1}`.padStart(2, '0');

  // 生成保单号
  newPolicyData.policyNo = policyNoSeg.join('-');
  const exists = await dao.getPolicyByNo(newPolicyData.policyNo, {
    attributes: ['id'],
  });
  if (exists) throw error400('该保单已被续保');

  // 生成承保时间
  newPolicyData.boundTime = moment().toISOString(true);
};

/**
 * 保存保单数据
 * @param {object} ctx 上下文对象
 */
const savePolicyData = async (ctx) => {
  const { newPolicyData } = ctx;
  ctx.policyDataSaved = await dao.savePolicy(newPolicyData);
};

/**
 * 组装响应数据
 * @param {object} ctx 上下文对象
 */
const assembleResponseData = (ctx) => {
  const { policyDataSaved, policy: policyOrgin } = ctx;
  const { policy, applicants, insureds } = policyDataSaved;

  return {
    orderNo: policy.orderNo,
    policyNo: policy.policyNo,
    contractCode: policyOrgin.Contract.code,
    contractVersion: policy.contractVersion,
    productCode: policyOrgin.Product.code,
    productVersion: policy.productVersion,
    planCode: policyOrgin.Plan.code,
    effectiveTime: policy.effectiveTime,
    expiryTime: policy.expiryTime,
    boundTime: policy.boundTime,
    premium: policy.premium,
    status: policy.status,
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
 * 续保保单
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const renewPolicy = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 查询保单
  await getPolicy(ctx, reqData, profile);

  // 根据业务规则生成新的保单数据
  await generateNewPolicyData(ctx);

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
  renewPolicy,
};
