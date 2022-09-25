const Joi = require('joi');

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} ctx 上下文对象
 * @param {object} bizConfig 业务规则配置（被保险人相关）
 * @returns {object} 校验模式（被保险人相关）
 */
const getInsuredsSchema = (ctx, bizConfig) => {
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
  } = bizConfig;
  const { policy } = ctx;
  const { insureds } = policy;

  // 校验模式
  const schema = {};

  // 被保险人编号相关
  schema.no = Joi.string();
  if (no.required) {
    schema.no = schema.no.required();
  }

  // 与投保人关系相关
  schema.relationship = Joi.string().allow(
    'self',
    'parents',
    'brothers',
    'sisters',
  );
  if (relationship.required) {
    schema.relationship = schema.relationship.required();
  }

  // 姓名相关
  schema.name = Joi.string();
  if (name.required) {
    schema.name = schema.name.required();
  }

  // 证件类型相关
  schema.idType = Joi.string().allow('idcard', 'passport');
  if (idType.required) {
    schema.idType = schema.idType.required();
  }

  // 证件号码相关
  schema.idNo = Joi.string();
  if (idNo.required) {
    schema.idNo = schema.idNo.required();
  }

  // 性别相关
  schema.gender = Joi.string().allow('man', 'female', 'other', 'unknown');
  if (gender.required) {
    schema.gender = schema.gender.required();
  }

  // 出生日期相关
  schema.birth = Joi.date().iso();
  if (birth.required) {
    schema.birth = schema.birth.required();
  }

  // 联系号码相关
  schema.contactNo = Joi.string();
  if (contactNo.required) {
    schema.contactNo = schema.contactNo.required();
  }

  // 电子邮箱地址
  schema.email = Joi.string().email();
  if (email.required) {
    schema.email = schema.email.required();
  }

  return {
    insureds: Joi.array()
      .items(Joi.object(schema).or('no', 'idType').or('no', 'idNo'))
      .max(insureds.length)
      .min(1),
  };
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} ctx 上下文对象
 * @param {object} claimBizConfig 业务规则配置（理赔部分）
 * @returns {Joi.ObjectSchema} 校验模式
 */
const getBizSchema = (ctx, claimBizConfig) => {
  const { insureds } = claimBizConfig || {};

  const bizSchema = {
    ...getInsuredsSchema(ctx, insureds),
  };

  return Joi.object(bizSchema);
};

module.exports = {
  getBizSchema,
};
