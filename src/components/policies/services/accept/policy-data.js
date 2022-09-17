const moment = require('moment');
const { timeCorrectTo, parseIdCard } = require('../../../../libraries/utils');

/**
 * 根据业务规则调整保单数据（保障期间）
 * @param {object} ctx 上下文对象
 * @param {object} bizConfig 业务规则配置
 */
const adjustPeriod = (ctx, bizConfig) => {
  const { policyData } = ctx;
  const { effectiveTime, expiryTime } = bizConfig.period;
  const actionRelativeMap = { before: 'subtract', after: 'add' };
  const now = Date.now();

  // 使用默认值
  if (!policyData.effectiveTime) {
    const { relative, unit, amount } = effectiveTime.default;
    policyData.effectiveTime = moment(now)
      [actionRelativeMap[relative]](amount, unit)
      .toISOString(true);
  }
  if (!policyData.expiryTime) {
    const { relative, unit, amount } = expiryTime.default;
    policyData.expiryTime = moment(now)
      [actionRelativeMap[relative]](amount, unit)
      .toISOString(true);
  }

  // 精确到指定单位
  policyData.effectiveTime = timeCorrectTo(
    policyData.effectiveTime,
    effectiveTime.correctTo,
  );
  policyData.expiryTime = timeCorrectTo(
    policyData.expiryTime,
    expiryTime.correctTo,
  );
};

/**
 * 根据业务规则调整保单数据（保费）
 * @param {object} ctx 上下文对象
 * @param {object} bizConfig 业务规则配置
 */
const adjustPremium = (ctx, bizConfig) => {
  const { policyData } = ctx;
  const { calculateMode, fixed } = bizConfig.premium;

  // 使用固定的值
  if (calculateMode === 'fixed') {
    policyData.premium = parseFloat(fixed);
  }
};

/**
 * 根据业务规则调整保单数据（投保人）
 * @param {object} ctx 上下文对象
 * @param {object} bizConfig 业务规则配置
 */
const adjustApplicants = (ctx, bizConfig) => {
  const { policyData } = ctx;
  const {
    idType,
    idNo,
    gender,
    birth,
    contactNo,
    email,
    default: defaultApplicant,
  } = bizConfig.applicants;

  policyData.applicants.forEach((applicant, idx) => {
    const ref = policyData.applicants[idx];

    // 证件类型
    if (!applicant.idType) {
      ref.idType = idType.default;
    }

    // 证件号码
    if (!applicant.idNo) {
      ref.idNo = idNo.default;
    }

    // 解析身份证号码
    let idCardParsed = null;
    if (applicant.idType === 'idcard') {
      idCardParsed = parseIdCard(applicant.idNo);
    }

    // 性别
    if (!applicant.gender) {
      ref.gender = gender.default;
    }
    if (applicant.idType === 'idcard' && gender.adoptIdCard) {
      ref.gender = idCardParsed.gender;
    }

    // 出生日期
    if (!applicant.birth) {
      ref.birth = birth.default;
    }
    if (applicant.idType === 'idcard' && birth.adoptIdCard) {
      ref.birth = idCardParsed.birth;
    }

    // 联系号码
    if (!applicant.contactNo) {
      ref.contactNo = contactNo.default;
    }

    // 电子邮箱地址
    if (!applicant.email) {
      ref.email = email.default;
    }
  });

  // 默认投保人
  if (defaultApplicant && defaultApplicant.length > 0) {
    policyData.applicants.push(...defaultApplicant);
  }
};

/**
 * 根据业务规则调整保单数据（被保险人）
 * @param {object} ctx 上下文对象
 * @param {object} bizConfig 业务规则配置
 */
const adjustInsureds = (ctx, bizConfig) => {
  const { policyData } = ctx;
  const { relationship, idType, idNo, gender, birth, contactNo, email } =
    bizConfig.insureds;

  policyData.insureds.forEach((insured, idx) => {
    const ref = policyData.insureds[idx];

    // 与投保人关系
    if (!insured.relationship) {
      ref.relationship = relationship.default;
    }

    // 证件类型
    if (!insured.idType) {
      ref.idType = idType.default;
    }

    // 证件号码
    if (!insured.idNo) {
      ref.idNo = idNo.default;
    }

    // 解析身份证号码
    let idCardParsed = null;
    if (insured.idType === 'idcard') {
      idCardParsed = parseIdCard(insured.idNo);
    }

    // 性别
    if (!insured.gender) {
      ref.gender = gender.default;
    }
    if (insured.idType === 'idcard' && gender.adoptIdCard) {
      ref.gender = idCardParsed.gender;
    }

    // 出生日期
    if (!insured.birth) {
      ref.birth = birth.default;
    }
    if (insured.idType === 'idcard' && birth.adoptIdCard) {
      ref.birth = idCardParsed.birth;
    }

    // 联系号码
    if (!insured.contactNo) {
      ref.contactNo = contactNo.default;
    }

    // 电子邮箱地址
    if (!insured.email) {
      ref.email = email.default;
    }
  });
};

/**
 * 根据业务规则调整保单数据
 * @param {object} ctx 上下文对象
 * @param {object} bizConfig 业务规则配置
 */
const adjustPolicyData = (ctx, bizConfig) => {
  adjustPeriod(ctx, bizConfig);
  adjustPremium(ctx, bizConfig);
  adjustApplicants(ctx, bizConfig);
  adjustInsureds(ctx, bizConfig);
};

module.exports = {
  adjustPolicyData,
};
