const moment = require('moment');
const Joi = require('joi');
const { timeCorrectTo } = require('../../../../libraries/utils');

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} bizConfig 业务规则配置（保障期间相关）
 * @returns {object} 校验模式（保障期间相关）
 */
const getPeriodSchema = (bizConfig) => {
  const { required, effectiveTime, expiryTime } = bizConfig;
  const actionRelativeMap = { before: 'subtract', after: 'add' };
  const now = Date.now();

  // 默认校验模式
  const schema = {
    effectiveTime: Joi.date().iso(),
    expiryTime: Joi.date().iso().greater(Joi.ref('effectiveTime')),
  };

  // 保单生效时间
  if (!effectiveTime.allowClientToSet) {
    // 不允许客户端进行设置（传入）
    delete schema.effectiveTime;
  } else {
    const { minimum, maximum, correctTo } = effectiveTime;

    // 必传
    if (required) {
      schema.effectiveTime = schema.effectiveTime.required();
    }

    // 最小值
    schema.effectiveTime = schema.effectiveTime.min(
      timeCorrectTo(
        moment(now)[actionRelativeMap[minimum.relative]](
          minimum.amount,
          minimum.unit,
        ),
        correctTo,
      ).format(),
    );

    // 最大值
    schema.effectiveTime = schema.effectiveTime.max(
      timeCorrectTo(
        moment(now)[actionRelativeMap[maximum.relative]](
          maximum.amount,
          maximum.unit,
        ),
        correctTo,
      ).format(),
    );
  }

  // 保单终止时间
  if (!expiryTime.allowClientToSet) {
    // 不允许客户端进行设置（传入）
    delete schema.expiryTime;
  } else if (required) {
    // 必传
    schema.expiryTime = schema.expiryTime.required();
  }

  return schema;
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} bizConfig 业务规则配置（保费相关）
 * @returns {object} 校验模式（保费相关）
 */
const getPremiumSchema = (bizConfig) => {
  const { calculateMode, minimum, maximum } = bizConfig;

  // 默认校验模式
  const schema = {
    premium: Joi.number().positive().precision(2),
  };

  // 使用固定值
  if (calculateMode === 'fixed') {
    delete schema.premium;
  }
  // 直接使用客户端指定的值
  else if (calculateMode === 'adoptClient') {
    schema.premium = schema.premium.required();
  }
  // 使用公式计算
  else if (calculateMode === 'formula') {
    //
  }

  // 允许的最小值
  if (schema.premium) {
    schema.premium = schema.premium.min(minimum);
  }

  // 允许的最大值
  if (schema.premium) {
    schema.premium = schema.premium.max(maximum);
  }

  return schema;
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} bizConfig 业务规则配置（扩展信息相关）
 * @returns {object} 校验模式（扩展信息相关）
 */
const getExtensionsSchema = (bizConfig) => {
  const { trackingNo } = bizConfig;

  // 默认校验模式
  const schema = {};

  // 物流单号
  {
    const { dataType, allowClientToSet, required } = trackingNo;
    if (allowClientToSet) {
      schema.trackingNo = Joi[dataType]();

      // 是否必须
      if (required) {
        schema.trackingNo = schema.trackingNo.required();
      }
    }
  }

  return Object.keys(schema).length > 0
    ? { extensions: Joi.object(schema).required() }
    : { extensions: Joi.object(schema) };
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} bizConfig 业务规则配置（投保人相关）
 * @returns {object} 校验模式（投保人相关）
 */
const getApplicantsSchema = (bizConfig) => {
  const {
    name,
    idType,
    idNo,
    gender,
    birth,
    contactNo,
    email,
    minimum,
    maximum,
  } = bizConfig;

  // 默认校验模式
  let schema = {
    name: Joi.string(),
    idType: Joi.string().allow('idcard', 'passport'),
    idNo: Joi.string(),
    gender: Joi.string().allow('man', 'female', 'other', 'unknown'),
    birth: Joi.date().iso(),
    contactNo: Joi.string(),
    email: Joi.string().email(),
  };

  // 姓名
  if (name.required) {
    schema.name = schema.name.required();
  }

  // 证件类型
  if (!idType.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.idType;
  } else {
    // 必须
    if (idType.required) {
      schema.idType = schema.idType.required();
    }

    // 允许的选项
    if (idType.options && idType.options.length > 0) {
      schema.idType = schema.idType.valid(Joi.override, ...idType.options);
    }
  }

  // 证件号码
  if (!idNo.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.idNo;
  } else if (idNo.required) {
    // 必须
    schema.idNo = schema.idNo.required();
  }

  // 性别
  if (!gender.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.gender;
  } else {
    // 必须
    if (gender.required) {
      schema.gender = schema.gender.required();
    }

    // 允许的选项
    if (gender.options && gender.options.length > 0) {
      schema.gender = schema.gender.valid(Joi.override, ...gender.options);
    }
  }

  // 出生日期
  if (!birth.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.birth;
  } else if (birth.required) {
    // 必须
    schema.birth = schema.birth.required();
  }

  // 联系号码
  if (!contactNo.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.contactNo;
  } else if (contactNo.required) {
    // 必须
    schema.contactNo = schema.contactNo.required();
  }

  // 电子邮箱地址
  if (!email.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.email;
  } else if (email.required) {
    // 必须
    schema.email = schema.email.required();
  }

  // 允许的最小投保人数
  // 允许的最大投保人数
  schema = {
    applicants: Joi.array().items(Joi.object(schema)).max(maximum).min(minimum),
  };

  return schema;
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} bizConfig 业务规则配置（被保险人相关）
 * @returns {object} 校验模式（被保险人相关）
 */
const getInsuredsSchema = (bizConfig) => {
  const {
    relationship,
    name,
    idType,
    idNo,
    gender,
    birth,
    contactNo,
    email,
    minimum,
    maximum,
  } = bizConfig;

  // 默认的校验模式
  let schema = {
    relationship: Joi.string().allow('self', 'parents', 'brothers', 'sisters'),
    name: Joi.string(),
    idType: Joi.string().allow('idcard', 'passport'),
    idNo: Joi.string(),
    gender: Joi.string().allow('man', 'female', 'other', 'unknown'),
    birth: Joi.date().iso(),
    contactNo: Joi.string(),
    email: Joi.string().email(),
    premium: Joi.number().positive().precision(2),
  };

  // 与投保人关系
  if (!relationship.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.relationship;
  } else {
    // 必须
    if (relationship.required) {
      schema.relationship = schema.relationship.required();
    }

    // 允许的选项
    if (relationship.options && relationship.options.length > 0) {
      schema.relationship = schema.relationship.valid(
        Joi.override,
        ...relationship.options,
      );
    }
  }

  // 姓名
  if (name.required) {
    schema.name = schema.name.required();
  }

  // 证件类型
  if (!idType.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.idType;
  } else {
    // 必须
    if (idType.required) {
      schema.idType = schema.idType.required();
    }

    // 允许的选项
    if (idType.options && idType.options.length > 0) {
      schema.idType = schema.idType.valid(Joi.override, ...idType.options);
    }
  }

  // 证件号码
  if (!idNo.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.idNo;
  } else if (idNo.required) {
    // 必须
    schema.idNo = schema.idNo.required();
  }

  // 性别
  if (!gender.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.gender;
  } else {
    // 必须
    if (gender.required) {
      schema.gender = schema.gender.required();
    }

    // 允许的选项
    if (gender.options && gender.options.length > 0) {
      schema.gender = schema.gender.valid(Joi.override, ...gender.options);
    }
  }

  // 出生日期
  if (!birth.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.birth;
  } else if (birth.required) {
    // 必须
    schema.birth = schema.birth.required();
  }

  // 联系号码
  if (!contactNo.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.contactNo;
  } else if (contactNo.required) {
    // 必须
    schema.contactNo = schema.contactNo.required();
  }

  // 电子邮箱地址
  if (!email.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.email;
  } else if (email.required) {
    // 必须
    schema.email = schema.email.required();
  }

  // 允许的最小被保险人数
  // 允许的最大被保险人数
  schema = {
    insureds: Joi.array().items(Joi.object(schema)).max(maximum).min(minimum),
  };

  return schema;
};

/**
 * 根据业务规则配置获取对应的校验模式
 * @param {object} acceptBizConfig 业务规则配置（承保部分）
 * @returns {Joi.ObjectSchema} 校验模式
 */
const getBizSchema = (acceptBizConfig) => {
  const { period, premium, extensions, applicants, insureds } =
    acceptBizConfig || {};

  const bizSchema = {
    ...getPeriodSchema(period),
    ...getPremiumSchema(premium),
    ...getExtensionsSchema(extensions),
    ...getApplicantsSchema(applicants),
    ...getInsuredsSchema(insureds),
  };

  return Joi.object(bizSchema);
};

/**
 * 根据业务规则配置获取对应的校验模式
 * 针对调整后的保单数据
 * @param {object} policyData 保单数据
 * @param {object} acceptBizConfig 业务规则配置（承保部分）
 * @returns {Joi.ObjectSchema} 校验模式
 */
const getBizSchemaForAdjusted = (policyData, acceptBizConfig) => {
  const { period, applicants, insureds } = acceptBizConfig || {};
  const bizSchema = {};

  // 保单终止时间
  {
    const { minimum, maximum, correctTo } = period.expiryTime;
    const actionRelativeMap = { before: 'subtract', after: 'add' };

    // 最小值&最大值
    bizSchema.expiryTime = Joi.date()
      .min(
        timeCorrectTo(
          moment(policyData.effectiveTime)
            [actionRelativeMap[minimum.relative]](minimum.amount, minimum.unit)
            .subtract(1, 'second'),
          correctTo,
        ).valueOf(),
      )
      .max(
        timeCorrectTo(
          moment(policyData.effectiveTime)
            [actionRelativeMap[maximum.relative]](maximum.amount, maximum.unit)
            .subtract(1, 'second'),
          correctTo,
        ).valueOf(),
      );
  }

  // 投保人
  {
    const { allowMinAge, allowMaxAge } = applicants.birth;

    // 允许的最小、最大年龄
    bizSchema.applicants = Joi.array().items(
      Joi.object({
        birth: Joi.date()
          .max(
            moment(policyData.effectiveTime)
              .subtract(allowMinAge.value, allowMinAge.unit)
              .valueOf(),
          )
          .min(
            moment(policyData.effectiveTime)
              .subtract(allowMaxAge.value, allowMaxAge.unit)
              .valueOf(),
          ),
      }),
    );
  }

  // 被保险人
  {
    const { allowMinAge, allowMaxAge } = insureds.birth;

    // 允许的最小、最大年龄
    bizSchema.insureds = Joi.array().items(
      Joi.object({
        birth: Joi.date()
          .max(
            moment(policyData.effectiveTime)
              .subtract(allowMinAge.value, allowMinAge.unit)
              .valueOf(),
          )
          .min(
            moment(policyData.effectiveTime)
              .subtract(allowMaxAge.value, allowMaxAge.unit)
              .valueOf(),
          ),
      }),
    );
  }

  return Joi.object(bizSchema);
};

module.exports = {
  getBizSchema,
  getBizSchemaForAdjusted,
};
