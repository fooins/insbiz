const moment = require('moment');
const Joi = require('joi');
const bizSchemaDefault = require('./schemas/biz-default');
const { timeCorrectTo } = require('../../../../libraries/utils');

/**
 * 根据业务规则配置（保障期间相关）
 * 调整校验模式（保障期间相关）
 * @param {object} bizConfig 业务规则配置（保障期间相关）
 * @returns {object} 调整后的校验模式（保障期间相关）
 */
const adjustPeriod = (bizConfig) => {
  const { required, effectiveTime, expiryTime } = bizConfig;
  const actionRelativeMap = { before: 'subtract', after: 'add' };
  const now = Date.now();

  // 初始化
  // 调整后的校验模式（保障期间相关）
  const schema = {
    effectiveTime: bizSchemaDefault.effectiveTime,
    expiryTime: bizSchemaDefault.expiryTime,
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
  } else {
    const { minimum, maximum, correctTo } = expiryTime;

    // 必传
    if (required) {
      schema.expiryTime = schema.expiryTime.required();
    }

    // 最小值
    schema.expiryTime = schema.expiryTime.min(
      timeCorrectTo(
        moment(now)[actionRelativeMap[minimum.relative]](
          minimum.amount,
          minimum.unit,
        ),
        correctTo,
      ).format(),
    );

    // 最大值
    schema.expiryTime = schema.expiryTime.max(
      timeCorrectTo(
        moment(now)[actionRelativeMap[maximum.relative]](
          maximum.amount,
          maximum.unit,
        ),
        correctTo,
      ).format(),
    );
  }

  return schema;
};

/**
 * 根据业务规则配置（保费相关）
 * 调整校验模式（保费相关）
 * @param {object} bizConfig 业务规则配置（保费相关）
 * @returns {object} 调整后的校验模式（保费相关）
 */
const adjustPremium = (bizConfig) => {
  const { calculateMode, minimum, maximum } = bizConfig;

  // 初始化
  // 调整后的校验模式（保费相关）
  const schema = {
    premium: bizSchemaDefault.premium,
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
 * 根据业务规则配置（投保人相关）
 * 调整校验模式（投保人相关）
 * @param {object} bizConfig 业务规则配置（投保人相关）
 * @returns {object} 调整后的校验模式（投保人相关）
 */
const adjustApplicants = (bizConfig) => {
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
  const now = Date.now();

  // 拷贝默认的投保人校验模式
  let schema = { ...bizSchemaDefault.applicants };

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
      schema.idType = schema.idType.valid(...idType.options);
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
      schema.gender = schema.gender.valid(...gender.options);
    }
  }

  // 出生日期
  if (!birth.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.birth;
  } else {
    // 必须
    if (birth.required) {
      schema.birth = schema.birth.required();
    }

    // 允许的最小年龄
    const { allowMinAge } = birth;
    schema.birth = schema.birth.max(
      moment(now).subtract(allowMinAge.value, allowMinAge.unit).format(),
    );

    // 允许的最大年龄
    const { allowMaxAge } = birth;
    schema.birth = schema.birth.min(
      moment(now).subtract(allowMaxAge.value, allowMaxAge.unit).format(),
    );
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
 * 根据业务规则配置（被保险人相关）
 * 调整校验模式（被保险人相关）
 * @param {object} bizConfig 业务规则配置（被保险人相关）
 * @returns {object} 调整后的校验模式（被保险人相关）
 */
const adjustInsureds = (bizConfig) => {
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
  const now = Date.now();

  // 拷贝默认的被保险人校验模式
  let schema = { ...bizSchemaDefault.insureds };

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
      schema.relationship = schema.relationship.valid(...relationship.options);
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
      schema.idType = schema.idType.valid(...idType.options);
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
      schema.gender = schema.gender.valid(...gender.options);
    }
  }

  // 出生日期
  if (!birth.allowClientToSet) {
    // 不允许客户端进行设置
    delete schema.birth;
  } else {
    // 必须
    if (birth.required) {
      schema.birth = schema.birth.required();
    }

    // 允许的最小年龄
    const { allowMinAge } = birth;
    schema.birth = schema.birth.max(
      moment(now).subtract(allowMinAge.value, allowMinAge.unit).format(),
    );

    // 允许的最大年龄
    const { allowMaxAge } = birth;
    schema.birth = schema.birth.min(
      moment(now).subtract(allowMaxAge.value, allowMaxAge.unit).format(),
    );
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
 * 根据业务规则配置调整校验模式
 * @param {object} bizConfig 业务规则配置
 * @returns {object} 调整后的校验模式
 */
const adjustSchema = (bizConfig) => {
  const { period, premium, applicants, insureds } = bizConfig || {};

  const bizSchema = {
    ...adjustPeriod(period),
    ...adjustPremium(premium),
    ...adjustApplicants(applicants),
    ...adjustInsureds(insureds),
  };

  return bizSchema;
};

module.exports = {
  adjustSchema,
};
