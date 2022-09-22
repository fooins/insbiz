const Joi = require('joi');
const moment = require('moment');
const dao = require('../../dao');
const { getBizSchema } = require('./biz-schema');
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
    includePlan: { attributes: ['code'] },
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
 * @param {object} reqData 请求数据
 */
const validation = async (ctx, reqData) => {
  const { policy } = ctx;
  const { endorse } = policy.bizConfigParsed;

  // 是否允许批改
  if (!endorse.allowEndorse) throw error400('该保单不允许批改');

  // 根据业务规则配置获取对应的校验模式
  const bizSchema = getBizSchema(ctx, reqData, endorse);

  // 剔除非业务规则相关的参数
  const reqDataBiz = { ...reqData };
  delete reqDataBiz.policyNo;

  // 执行业务规则校验
  const { error } = bizSchema.validate(reqDataBiz);
  if (error) {
    const {
      details: [{ path }],
    } = error;
    throw error400(error.message, {
      target: path && path[0],
      cause: error,
    });
  }

  // 检查计划
  if (reqData.planCode) {
    const plan = await dao.getPlanByCode(
      reqData.planCode,
      policy.productVersion,
    );
    if (!plan) throw error400('保险产品计划不存在');
    if (plan.productId !== policy.productId) {
      throw error400('计划不属于保单关联的保险产品');
    }

    ctx.plan = plan;
  }

  // 检查投保人
  if (reqData.applicants) {
    const noSet = new Set();
    reqData.applicants.forEach((applicant) => {
      const { no } = applicant;

      // 原保单对应的投保人
      const oriApplicant = policy.applicants.find((ap) => ap.no === no);
      if (!oriApplicant) throw error400(`投保人不存在或不属于当前保单(${no})`);

      // 重复校验
      if (noSet.has(no)) throw error400(`该投保人重复(${no})`);
      else noSet.add(no);
    });
  }

  // 检查被保险人
  if (reqData.insureds) {
    const noSet = new Set();
    reqData.insureds.forEach((insured) => {
      const { no } = insured;

      // 原保单对应的被保险人
      const orInsured = policy.insureds.find((i) => i.no === no);
      if (!orInsured) throw error400(`被保险人不存在或不属于当前保单(${no})`);

      // 重复校验
      if (noSet.has(no)) throw error400(`该被保险人重复(${no})`);
      else noSet.add(no);
    });
  }
};

/**
 * 生成批单数据
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 */
const generateEndorsementData = async (ctx, reqData) => {
  const { policy } = ctx;
  const { planCode, effectiveTime, expiryTime, applicants, insureds } = reqData;

  const endorsementData = {
    policyId: policy.id,
    details: [],
  };

  // 批改计划
  if (planCode && planCode !== policy.Plan.code) {
    endorsementData.details.push({
      type: 'policy',
      field: 'planCode',
      original: policy.Plan.code,
      current: planCode,
    });
  }

  // 批改保单生效时间
  if (
    effectiveTime &&
    moment(effectiveTime).toISOString() !==
      moment(policy.effectiveTime).toISOString()
  ) {
    endorsementData.details.push({
      type: 'policy',
      field: 'effectiveTime',
      original: policy.effectiveTime,
      current: effectiveTime,
    });
  }

  // 批改保单终止时间
  if (
    expiryTime &&
    moment(expiryTime).toISOString() !== moment(policy.expiryTime).toISOString()
  ) {
    endorsementData.details.push({
      type: 'policy',
      field: 'expiryTime',
      original: policy.expiryTime,
      current: expiryTime,
    });
  }

  // 批改投保人
  applicants.forEach((applicant) => {
    const { no, name, idType, idNo, gender, birth, contactNo, email } =
      applicant;

    // 原保单对应的投保人
    const oriApplicant = policy.applicants.find((ap) => ap.no === no);

    // 批改姓名
    if (name && name !== oriApplicant.name) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'name',
        original: oriApplicant.name,
        current: name,
        targetNo: no,
      });
    }

    // 批改证件类型
    if (idType && idType !== oriApplicant.idType) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'idType',
        original: oriApplicant.idType,
        current: idType,
        targetNo: no,
      });
    }

    // 批改证件号码
    if (idNo && idNo !== oriApplicant.idNo) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'idNo',
        original: oriApplicant.idNo,
        current: idNo,
        targetNo: no,
      });
    }

    // 批改性别
    if (gender && gender !== oriApplicant.gender) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'gender',
        original: oriApplicant.gender,
        current: gender,
        targetNo: no,
      });
    }

    // 批改出生日期
    if (
      birth &&
      moment(birth).toISOString() !== moment(oriApplicant.birth).toISOString()
    ) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'birth',
        original: oriApplicant.birth,
        current: birth,
        targetNo: no,
      });
    }

    // 批改联系号码
    if (contactNo && contactNo !== oriApplicant.contactNo) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'contactNo',
        original: oriApplicant.contactNo,
        current: contactNo,
        targetNo: no,
      });
    }

    // 批改电子邮箱地址
    if (email && email !== oriApplicant.email) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'email',
        original: oriApplicant.email,
        current: email,
        targetNo: no,
      });
    }
  });

  // 批改被保险人
  insureds.forEach((insured) => {
    const {
      no,
      relationship,
      name,
      idType,
      idNo,
      gender,
      birth,
      contactNo,
      email,
    } = insured;

    // 原保单对应的被保险人
    const oriInsured = policy.insureds.find((i) => i.no === no);

    // 批改与投保人关系
    if (relationship && relationship !== oriInsured.relationship) {
      endorsementData.details.push({
        type: 'insured',
        field: 'relationship',
        original: oriInsured.relationship,
        current: relationship,
        targetNo: no,
      });
    }

    // 批改姓名
    if (name && name !== oriInsured.name) {
      endorsementData.details.push({
        type: 'insured',
        field: 'name',
        original: oriInsured.name,
        current: name,
        targetNo: no,
      });
    }

    // 批改证件类型
    if (idType && idType !== oriInsured.idType) {
      endorsementData.details.push({
        type: 'insured',
        field: 'idType',
        original: oriInsured.idType,
        current: idType,
        targetNo: no,
      });
    }

    // 批改证件号码
    if (idNo && idNo !== oriInsured.idNo) {
      endorsementData.details.push({
        type: 'insured',
        field: 'idNo',
        original: oriInsured.idNo,
        current: idNo,
        targetNo: no,
      });
    }

    // 批改性别
    if (gender && gender !== oriInsured.gender) {
      endorsementData.details.push({
        type: 'insured',
        field: 'gender',
        original: oriInsured.gender,
        current: gender,
        targetNo: no,
      });
    }

    // 批改出生日期
    if (
      birth &&
      moment(birth).toISOString() !== moment(oriInsured.birth).toISOString()
    ) {
      endorsementData.details.push({
        type: 'insured',
        field: 'birth',
        original: oriInsured.birth,
        current: birth,
        targetNo: no,
      });
    }

    // 批改联系号码
    if (contactNo && contactNo !== oriInsured.contactNo) {
      endorsementData.details.push({
        type: 'insured',
        field: 'contactNo',
        original: oriInsured.contactNo,
        current: contactNo,
        targetNo: no,
      });
    }

    // 批改电子邮箱地址
    if (email && email !== oriInsured.email) {
      endorsementData.details.push({
        type: 'insured',
        field: 'email',
        original: oriInsured.email,
        current: email,
        targetNo: no,
      });
    }
  });

  ctx.endorsementData = endorsementData;
};

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

  // 执行校验
  await validation(ctx, reqData);

  // 生成批单数据
  await generateEndorsementData(ctx, reqData);

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
