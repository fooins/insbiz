const Joi = require('joi');
const moment = require('moment');
const dao = require('../../dao');
const formulas = require('../../../../libraries/formulas');
const { getBizSchema } = require('./biz-schema');
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
 */
const generateEndorsementData = async (ctx) => {
  const { policy, reqDataValidated } = ctx;
  const {
    planCode,
    effectiveTime,
    expiryTime,
    applicants = [],
    insureds = [],
  } = reqDataValidated;

  const endorsementData = {
    policyId: policy.id,
    details: [],
  };
  const newPolicyData = {
    applicants: [],
    insureds: [],
  };

  // 批改计划
  if (planCode && planCode !== policy.Plan.code) {
    endorsementData.details.push({
      type: 'policy',
      field: 'planCode',
      original: policy.Plan.code,
      current: planCode,
    });
    newPolicyData.planCode = planCode;
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
      original: moment(policy.effectiveTime).toISOString(true),
      current: moment(effectiveTime).toISOString(true),
    });
    newPolicyData.effectiveTime = effectiveTime;
  }

  // 批改保单终止时间
  if (
    expiryTime &&
    moment(expiryTime).toISOString() !== moment(policy.expiryTime).toISOString()
  ) {
    endorsementData.details.push({
      type: 'policy',
      field: 'expiryTime',
      original: moment(policy.expiryTime).toISOString(true),
      current: moment(expiryTime).toISOString(true),
    });
    newPolicyData.expiryTime = expiryTime;
  }

  // 批改投保人
  applicants.forEach((applicant) => {
    const { no, name, idType, idNo, gender, birth, contactNo, email } =
      applicant;
    const newApplicantData = { no };

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
      newApplicantData.name = name;
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
      newApplicantData.idType = idType;
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
      newApplicantData.idNo = idNo;
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
      newApplicantData.gender = gender;
    }

    // 批改出生日期
    if (
      birth &&
      moment(birth).toISOString() !== moment(oriApplicant.birth).toISOString()
    ) {
      endorsementData.details.push({
        type: 'applicant',
        field: 'birth',
        original: moment(oriApplicant.birth).toISOString(true),
        current: moment(birth).toISOString(true),
        targetNo: no,
      });
      newApplicantData.birth = birth;
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
      newApplicantData.contactNo = contactNo;
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
      newApplicantData.email = email;
    }

    newPolicyData.applicants.push(newApplicantData);
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
    const newInsuredData = { no };

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
      newInsuredData.relationship = relationship;
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
      newInsuredData.name = name;
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
      newInsuredData.idType = idType;
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
      newInsuredData.idNo = idNo;
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
      newInsuredData.gender = gender;
    }

    // 批改出生日期
    if (
      birth &&
      moment(birth).toISOString() !== moment(oriInsured.birth).toISOString()
    ) {
      endorsementData.details.push({
        type: 'insured',
        field: 'birth',
        original: moment(oriInsured.birth).toISOString(true),
        current: moment(birth).toISOString(true),
        targetNo: no,
      });
      newInsuredData.birth = birth;
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
      newInsuredData.contactNo = contactNo;
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
      newInsuredData.email = email;
    }

    newPolicyData.insureds.push(newInsuredData);
  });

  if (
    newPolicyData.applicants.length === 0 &&
    newPolicyData.insureds.length === 0 &&
    Object.keys(newPolicyData).length === 2
  ) {
    throw error400('没有有效的批改项');
  }

  ctx.endorsementData = endorsementData;
  ctx.newPolicyData = newPolicyData;
};

/**
 * 计费
 * @param {object} ctx 上下文对象
 */
const charging = async (ctx) => {
  const { policy, newPolicyData, endorsementData } = ctx;
  const { endorse } = policy.bizConfigParsed;
  const { calculateMode, formula, minimum, maximum } = endorse.premium;

  // 组装完整的新保单数据
  const newPolicy = {
    ...policy.dataValues,
    ...newPolicyData,
    applicants: [],
    insureds: [],
  };
  policy.applicants.forEach((applicant) => {
    newPolicy.applicants.push({
      ...applicant.dataValues,
      ...newPolicyData.applicants.find((a) => a.no === applicant.no),
    });
  });
  policy.insureds.forEach((insured) => {
    newPolicy.insureds.push({
      ...insured.dataValues,
      ...newPolicyData.insureds.find((i) => i.no === insured.no),
    });
  });

  // 计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](
      {
        ...ctx,
        newPolicy,
      },
      'endorse',
      params,
    );
  }

  // 校验
  let totalPremium = 0;
  const difference = newPolicy.premium - policy.premium;
  newPolicy.insureds.forEach((insured) => {
    totalPremium += insured.premium;
  });
  if (totalPremium !== newPolicy.premium) {
    throw error500(`计费错误，被保险人总保费不等于保单保费`);
  }
  if (difference < minimum) {
    throw error400(`批减费用不允许小于 ${minimum} 元`);
  }
  if (difference > maximum) {
    throw error400(`批增费用不允许大于 ${maximum} 元`);
  }

  // 生成数据
  endorsementData.difference = difference;
  if (endorsementData.difference !== 0) {
    endorsementData.details.push({
      type: 'policy',
      field: 'premium',
      original: policy.premium,
      current: newPolicy.premium,
    });
    newPolicyData.premium = newPolicy.premium;
  }
  newPolicy.insureds.forEach((insured) => {
    const oriInsured = policy.insureds.find((i) => i.no === insured.no);
    if (insured.premium !== oriInsured.premium) {
      let exists = false;
      newPolicyData.insureds.forEach((newData, idx) => {
        if (insured.no === newData.no) {
          exists = true;
          newPolicyData.insureds[idx].premium = insured.premium;
        }
      });
      if (!exists) {
        newPolicyData.insureds.push({
          no: insured.no,
          premium: insured.premium,
        });
      }

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
