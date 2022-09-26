const Joi = require('joi');
const moment = require('moment');
const dao = require('../../dao');
const formulas = require('../../../../libraries/formulas');
const { getBizSchema } = require('./biz-schema');
const { getRedis } = require('../../../../libraries/redis');
const {
  error400,
  error403,
  error404,
  error500,
  hasOwnProperty,
} = require('../../../../libraries/utils');

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
  if (['canceled'].includes(policy.status)) {
    throw error400('保单当前状态不允许退保');
  }
  if (
    moment(policy.effectiveTime).isAfter(moment()) ||
    moment(policy.expiryTime).isBefore(moment())
  ) {
    throw error400('保单当前不在有效期内');
  }

  ctx.policy = policy;
};

/**
 * 执行校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 */
const validation = async (ctx, reqData) => {
  const { policy } = ctx;
  const { claim } = policy.bizConfigParsed;

  // 是否存在待处理的理赔单
  const pendingClaim = dao.queryClaim({
    attributes: ['id'],
    where: { policyId: policy.id, status: 'pending' },
  });
  if (pendingClaim) throw error400('该保单已存在待处理的理赔单');

  // 根据业务规则配置获取对应的校验模式
  const bizSchema = getBizSchema(ctx, claim);

  // 剔除非业务规则相关的参数
  const reqDataBiz = { ...reqData };
  delete reqDataBiz.policyNo;

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
  }
  ctx.reqDataValidated = value;

  // 检查被保险人
  const noSet = new Set();
  ctx.reqDataValidated.insureds.forEach((insured, idx) => {
    const { no, idType, idNo } = insured;

    // 原保单对应的被保险人
    let orInsured = null;
    if (no) {
      orInsured = policy.insureds.find((i) => i.no === no);
    } else {
      orInsured = policy.insureds.find(
        (i) => i.idType === idType && i.idNo === idNo,
      );
      if (orInsured) ctx.reqDataValidated.insureds[idx].no = orInsured.no;
    }
    if (!orInsured) throw error400('被保险人不存在或不属于当前保单');

    // 重复校验
    if (noSet.has(orInsured.no)) {
      throw error400(`该被保险人重复(${orInsured.no}|${idNo})`);
    } else {
      noSet.add(orInsured.no);
    }
  });
};

/**
 * 生成理赔单数据
 * @param {object} ctx 上下文对象
 * @param {object} profile 身份数据
 */
const generateClaimData = async (ctx, profile) => {
  const { policy, reqDataValidated } = ctx;
  const { claim } = policy.bizConfigParsed;
  const { producer } = profile;

  const claimData = {
    policyId: policy.id,
    producerId: producer.id,
    bizConfig: JSON.stringify(claim),
    insureds: reqDataValidated.insureds,
  };

  ctx.claimData = claimData;
};

/**
 * 计算赔付金额
 * @param {object} ctx 上下文对象
 */
const charging = async (ctx) => {
  const { policy, claimData } = ctx;
  const { claim } = policy.bizConfigParsed;
  const { calculateMode, formula } = claim.premium;

  // 计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](ctx, 'claim', params);
  }

  // 校验
  let totalSumInsured = 0;
  claimData.insureds.forEach((insured) => {
    totalSumInsured += insured.sumInsured;
  });
  if (totalSumInsured !== claimData.sumInsured) {
    throw error500(`计费错误，被保险人总保额不等于理赔单总保额`);
  }
};

/**
 * 生成理赔单号
 * @param {object} ctx 上下文对象
 */
const generateClaimNo = async (ctx) => {
  // 获取自增序号
  const incr = await getRedis().incr('claim-no-incr');

  // 生成理赔单号
  const date = moment().format('YYYYMMDD');
  const incrStr = `${incr}`.padStart(6, '0');
  const claimNo = `CLAIMS${date}${incrStr}`;

  ctx.claimData.claimNo = claimNo;
};

/**
 * 保存数据
 * @param {object} ctx 上下文对象
 */
const saveClaimData = async (ctx) => {
  const { claimData } = ctx;

  // 组装保存的数据
  const saveData = {
    claimData,
  };

  // 保存理赔单
  ctx.dataSaved = await dao.saveClaims(saveData);
};

/**
 * 组装响应数据
 * @param {object} ctx 上下文对象
 */
const assembleResponseData = async (ctx) => {
  const { dataSaved, policy } = ctx;
  const { claim, claimInsureds } = dataSaved;

  return {
    claimNo: claim.claimNo,
    policyNo: policy.policyNo,
    status: claim.status,
    insureds: claimInsureds.map((insured) => ({
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

/**
 * 申请理赔
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const applyClaims = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 查询保单
  await getPolicy(ctx, reqData, profile);

  // 执行校验
  await validation(ctx, reqData);

  // 生成理赔单数据
  await generateClaimData(ctx, profile);

  // 计算赔付金额
  await charging(ctx);

  // 生成理赔单号
  await generateClaimNo(ctx);

  // 保存数据
  await saveClaimData(ctx);

  // 组装响应数据
  const responseData = assembleResponseData(ctx);

  return responseData;
};

module.exports = {
  applyClaims,
};
