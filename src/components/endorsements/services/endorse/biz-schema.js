const Joi = require('joi');
const moment = require('moment');

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} bizConfig 业务规则配置（保单相关）
 * @returns {object} 校验模式（保单相关）
 */
const getPolicySchema = (ctx, reqData, bizConfig) => {
  const { policy } = ctx;
  const { allowEndorse, plan, effectiveTime, expiryTime } = bizConfig;
  const actionRelativeMap = { before: 'subtract', after: 'add' };

  // 校验模式
  const schema = {};
  if (!allowEndorse) return schema;

  // 计划相关
  if (plan && plan.allowEndorse) {
    schema.planCode = Joi.string();
  }

  // 保单生效时间相关
  if (effectiveTime && effectiveTime.allowEndorse) {
    const { minimum, maximum } = effectiveTime;
    schema.effectiveTime = Joi.date()
      .iso()
      .min(
        moment(policy.effectiveTime)
          [actionRelativeMap[minimum.relative]](minimum.amount, minimum.unit)
          .format(),
      )
      .max(
        moment(policy.effectiveTime)
          [actionRelativeMap[maximum.relative]](maximum.amount, maximum.unit)
          .format(),
      );
  }

  // 保单终止时间相关
  if (expiryTime && expiryTime.allowEndorse) {
    const { minimum, maximum } = expiryTime;

    schema.expiryTime = Joi.date()
      .iso()
      .min(
        moment(policy.expiryTime)
          [actionRelativeMap[minimum.relative]](minimum.amount, minimum.unit)
          .format(),
      )
      .max(
        moment(policy.expiryTime)
          [actionRelativeMap[maximum.relative]](maximum.amount, maximum.unit)
          .format(),
      );

    if (schema.effectiveTime && reqData.effectiveTime) {
      schema.expiryTime = schema.expiryTime.greater(Joi.ref('effectiveTime'));
    } else {
      schema.expiryTime = schema.expiryTime.greater(
        moment(policy.effectiveTime).toISOString(true),
      );
    }
  }

  return schema;
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} bizConfig 业务规则配置（投保人相关）
 * @returns {object} 校验模式（投保人相关）
 */
const getApplicantsSchema = (ctx, reqData, bizConfig) => {
  const {
    allowEndorse,
    maximum,
    name,
    idType,
    idNo,
    gender,
    birth,
    contactNo,
    email,
  } = bizConfig;

  // 校验模式
  const schema = {};
  if (!allowEndorse) return schema;

  // 投保人编号
  schema.no = Joi.string().required();

  // 姓名相关
  if (name && name.allowEndorse) {
    schema.name = Joi.string();
  }

  // 证件类型相关
  if (idType && idType.allowEndorse) {
    schema.idType = Joi.string().allow('idcard', 'passport');
  }

  // 证件号码相关
  if (idNo && idNo.allowEndorse) {
    schema.idNo = Joi.string();
  }

  // 性别相关
  if (gender && gender.allowEndorse) {
    schema.gender = Joi.string().allow('man', 'female', 'other', 'unknown');
  }

  // 出生日期相关
  if (birth && birth.allowEndorse) {
    schema.birth = Joi.date().iso();
  }

  // 联系号码相关
  if (contactNo && contactNo.allowEndorse) {
    schema.contactNo = Joi.string();
  }

  // 电子邮箱地址
  if (email && email.allowEndorse) {
    schema.email = Joi.string().email();
  }

  return {
    applicants: Joi.array().items(Joi.object(schema)).max(maximum),
  };
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} bizConfig 业务规则配置（被保险人相关）
 * @returns {object} 校验模式（被保险人相关）
 */
const getInsuredsSchema = (ctx, reqData, bizConfig) => {
  const {
    allowEndorse,
    maximum,
    relationship,
    name,
    idType,
    idNo,
    gender,
    birth,
    contactNo,
    email,
  } = bizConfig;

  // 校验模式
  const schema = {};
  if (!allowEndorse) return schema;

  // 被保险人编号
  schema.no = Joi.string().required();

  // 与投保人关系相关
  if (relationship && relationship.allowEndorse) {
    schema.relationship = Joi.string().allow(
      'self',
      'parents',
      'brothers',
      'sisters',
    );
  }

  // 姓名相关
  if (name && name.allowEndorse) {
    schema.name = Joi.string();
  }

  // 证件类型相关
  if (idType && idType.allowEndorse) {
    schema.idType = Joi.string().allow('idcard', 'passport');
  }

  // 证件号码相关
  if (idNo && idNo.allowEndorse) {
    schema.idNo = Joi.string();
  }

  // 性别相关
  if (gender && gender.allowEndorse) {
    schema.gender = Joi.string().allow('man', 'female', 'other', 'unknown');
  }

  // 出生日期相关
  if (birth && birth.allowEndorse) {
    schema.birth = Joi.date().iso();
  }

  // 联系号码相关
  if (contactNo && contactNo.allowEndorse) {
    schema.contactNo = Joi.string();
  }

  // 电子邮箱地址
  if (email && email.allowEndorse) {
    schema.email = Joi.string().email();
  }

  return {
    insureds: Joi.array().items(Joi.object(schema)).max(maximum),
  };
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} endorseBizConfig 业务规则配置（批改部分）
 * @returns {Joi.ObjectSchema} 校验模式
 */
const getBizSchema = (ctx, reqData, endorseBizConfig) => {
  const { policy, applicants, insureds } = endorseBizConfig || {};

  const bizSchema = {
    ...getPolicySchema(ctx, reqData, policy),
    ...getApplicantsSchema(ctx, reqData, applicants),
    ...getInsuredsSchema(ctx, reqData, insureds),
  };

  return Joi.object(bizSchema);
};

module.exports = {
  getBizSchema,
};
