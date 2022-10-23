const Joi = require('joi');
const moment = require('moment');
const _ = require('lodash');
const {
  error400,
  error500,
  hasOwnProperty,
  sleep,
  getRandomNum,
  md5,
} = require('../../../../libraries/utils');
const { getBizConfig } = require('../../../../libraries/biz-config');
const { getRedis } = require('../../../../libraries/redis');
const dao = require('../../dao');
const formulas = require('../../../../libraries/formulas');
const { getBizSchema, getBizSchemaForAdjusted } = require('./biz-schema');
const { adjustPolicyData } = require('./policy-data');
const {
  AppError,
  ErrorCodes,
} = require('../../../../libraries/error-handling');

/**
 * 获取占位标识
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @returns {string} 占位标识
 */
const getPlaceholderKey = (ctx, reqData) => {
  const { policyData } = ctx;
  const { applicants, insureds } = reqData;

  let placeholderKey = `${policyData.orderNo}${ctx.producer.id}`;

  if (applicants) {
    const obj = {};
    applicants.forEach((applicant) => {
      const { name = '', idType = '', idNo = '' } = applicant;
      const key = md5(`${name}${idType}${idNo}`);
      obj[key] = key;
    });

    const keys = Object.keys(obj);
    keys.sort();

    keys.forEach((key) => {
      placeholderKey += key;
    });
  }

  if (insureds) {
    const obj = {};
    insureds.forEach((insured) => {
      const { name = '', idType = '', idNo = '' } = insured;
      const key = md5(`${name}${idType}${idNo}`);
      obj[key] = key;
    });

    const keys = Object.keys(obj);
    keys.sort();

    keys.forEach((key) => {
      placeholderKey += key;
    });
  }

  placeholderKey = `accept:${md5(placeholderKey)}`;
  ctx.placeholderKey = placeholderKey;

  return placeholderKey;
};

/**
 * 通过请求数据查询保单
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @returns {object|undefined}
 */
const getPolicyByReqData = async (ctx, reqData) => {
  const { policyData, producer } = ctx;
  const { applicants: reqApplicants, insureds: reqInsureds } = reqData;

  const policy = await dao.getPolicyByOrderNo(
    `${policyData.orderNo}`.trim(),
    producer.id,
    {
      attributes: { exclude: ['bizConfig'] },
      includeContract: {
        attributes: ['code', 'version'],
      },
      includeProduct: {
        attributes: ['code', 'version'],
      },
      includePlan: {
        attributes: ['code', 'version'],
      },
      queryApplicants: true,
      queryInsureds: true,
      parseExtensions: true,
    },
  );
  if (!policy) return undefined;
  const { applicants: policyApplicants, insureds: policyInsureds } = policy;

  // 比对投保人
  for (let i = 0; i < policyApplicants.length; i += 1) {
    const applicant = policyApplicants[i];

    const reqApplicant = reqApplicants.find(
      (a) =>
        `${a.name}`.trim() === applicant.name &&
        `${a.idType}`.trim() === applicant.idType &&
        `${a.idNo}`.trim() === applicant.idNo,
    );

    if (!reqApplicant) {
      throw error400('订单号已存在', {
        target: 'orderNo',
      });
    }
  }

  // 比对被保险人
  for (let i = 0; i < policyInsureds.length; i += 1) {
    const insured = policyInsureds[i];

    const reqInsured = reqInsureds.find(
      (ins) =>
        `${ins.name}`.trim() === insured.name &&
        `${ins.idType}`.trim() === insured.idType &&
        `${ins.idNo}`.trim() === insured.idNo,
    );

    if (!reqInsured) {
      throw error400('订单号已存在', {
        target: 'orderNo',
      });
    }
  }

  return policy;
};

/**
 * 组装响应数据（通过已存在的保单信息）
 * @param {object} policy 保单信息
 * @returns {object} 响应的数据
 */
const assembleResponseDataByPolicy = (policy) => {
  const { Contract, Product, Plan, applicants, insureds } = policy;
  return {
    orderNo: policy.orderNo,
    policyNo: policy.policyNo,
    contractCode: Contract.code,
    contractVersion: `${Contract.version}`,
    productCode: Product.code,
    productVersion: `${Product.version}`,
    planCode: Plan.code,
    effectiveTime: policy.effectiveTime,
    expiryTime: policy.expiryTime,
    boundTime: policy.boundTime,
    premium: policy.premium,
    status: policy.status,
    extensions: policy.extensionsParsed,
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
 * 幂等处理
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 */
const idempotent = async (ctx, reqData) => {
  // 是否有相同的请求正在处理
  const placeholderKey = getPlaceholderKey(ctx, reqData);
  const setRst = await getRedis().setnx(placeholderKey, '1');
  const handing = setRst === 0;

  // 没有相同的请求
  if (!handing) {
    // 查询保单
    const policy = await getPolicyByReqData(ctx, reqData);

    // 返回成功结果
    if (policy) {
      ctx.responseData = assembleResponseDataByPolicy(policy);
      return;
    }

    // 继续投保逻辑
    return;
  }

  // 等待
  let totalWaitingTime = 0; // 总等待时长
  const waitingLimit = 10000; // 等待时长限制（毫秒）
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 随机等待一定的时长（可控范围内）
    const waitingTime = getRandomNum(200, 1000);
    totalWaitingTime += waitingTime;
    // eslint-disable-next-line no-await-in-loop
    await sleep(waitingTime);

    // 处理中的请求是否已完成
    // eslint-disable-next-line no-await-in-loop
    const setAgainRst = await getRedis().setnx(placeholderKey, '1');
    const done = setAgainRst === 1;
    if (done) {
      // 查询保单
      // eslint-disable-next-line no-await-in-loop
      const policy = await getPolicyByReqData(ctx, reqData);

      // 返回成功结果
      if (policy) {
        ctx.responseData = assembleResponseDataByPolicy(policy);
        return;
      }

      // 查不到保单则报错
      throw error500('保单数据有误');
    }

    // 总等待时长是否超过限制
    const over = totalWaitingTime > waitingLimit;
    if (over) {
      throw new AppError('服务超时，请稍候再试', {
        code: ErrorCodes.ServiceUnavailable,
        HTTPStatus: 503,
      });
    }
  }
};

/**
 * 执行基本校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 * @param {object} profile 身份数据
 */
const basalValidation = async (ctx, reqData, profile) => {
  // 组装待校验的数据
  const data = {};
  if (reqData.orderNo) data.orderNo = reqData.orderNo;
  if (reqData.contractCode) data.contractCode = reqData.contractCode;
  if (reqData.contractVersion) data.contractVersion = reqData.contractVersion;
  if (reqData.planCode) data.planCode = reqData.planCode;

  // 校验策略
  const schema = Joi.object({
    orderNo: Joi.string()
      .max(64)
      .pattern(/^[a-zA-Z0-9_]*$/)
      .required(),
    contractCode: Joi.string().required(),
    contractVersion: Joi.string(),
    planCode: Joi.string().required(),
  });

  // 字段校验
  const { error, value } = schema.validate(data);
  if (error) {
    const {
      details: [{ path }],
    } = error;

    throw error400(error.message, {
      target: path && path[0],
      cause: error,
    });
  } else {
    ctx.policyData = {
      orderNo: value.orderNo,
      contractCode: value.contractCode,
      contractVersion: value.contractVersion,
      planCode: value.planCode,
    };
  }

  // 查询销售渠道
  const producer = await dao.getProducerByCode(profile.producer.code);
  if (!producer) throw error500('获取销售渠道信息失败');
  ctx.producer = producer;

  // 幂等处理
  await idempotent(ctx, reqData);
  if (ctx.responseData) return;

  // 检查契约
  const contract = await dao.getContractByCode(
    ctx.policyData.contractCode,
    ctx.policyData.contractVersion,
    { includeProduct: true },
  );
  if (!contract) {
    throw error400('契约不存在');
  } else {
    ctx.contract = contract;
    ctx.product = contract.Product;
  }
  if (contract.producerId !== producer.id) throw error400('契约不属于当前渠道');

  // 检查计划
  const plan = await dao.getPlanByCode(
    ctx.policyData.planCode,
    ctx.product.version,
  );
  if (!plan) {
    throw error400('保险产品计划不存在');
  } else {
    ctx.plan = plan;
  }
  if (plan.productId !== ctx.product.id) {
    throw error400('计划不属于当前保险产品');
  }
};

/**
 * 执行业务规则校验
 * @param {object} ctx 上下文对象
 * @param {object} reqData 请求数据
 */
const bizValidation = async (ctx, reqData) => {
  const { product, plan, producer, contract, policyData } = ctx;

  // 剔除非业务规则相关的参数
  const reqDataBiz = { ...reqData };
  delete reqDataBiz.orderNo;
  delete reqDataBiz.contractCode;
  delete reqDataBiz.contractVersion;
  delete reqDataBiz.planCode;

  // 获取业务规则配置
  const bizConfig = await getBizConfig({
    product,
    plan,
    producer,
    contract,
  });
  const acceptBizConfig = bizConfig.accept;
  ctx.bizConfig = bizConfig;

  // 根据业务规则配置获取对应的校验模式
  const bizSchema = getBizSchema(acceptBizConfig);

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
  } else {
    ctx.policyData = _.merge(policyData, value);
  }

  // 根据业务规则调整保单数据
  adjustPolicyData(ctx, acceptBizConfig);

  // 根据业务规则配置获取对应的校验模式
  // 针对调整后的保单数据
  const bizSchemaForAdjusted = getBizSchemaForAdjusted(
    policyData,
    acceptBizConfig,
  );

  // 执行业务规则校验
  // 针对调整后的保单数据
  const { error: err } = bizSchemaForAdjusted.validate(policyData, {
    allowUnknown: true,
    stripUnknown: true,
  });
  if (err) {
    const {
      details: [{ path }],
    } = err;

    throw error400(err.message, {
      target: path && path[0],
      cause: err,
    });
  }
};

/**
 * 执行重复投保校验
 * @param {object} ctx 上下文对象
 */
const repeatInsuredValidation = async (ctx) => {
  const { policyData, product, plan, bizConfig } = ctx;
  const { insureds } = policyData;
  const { insureds: bizConfigInsureds } = bizConfig.accept;
  const { primaryFields } = bizConfigInsureds;

  // 是否有任意一个被保险人正在投保中
  let handing = false;
  const insuredPlaceholderKeys = {};
  for (let i = 0; i < insureds.length; i += 1) {
    const insured = insureds[i];

    // 生成占位标识
    let insuredPlaceholderKey = `${product.id}${product.version}${plan.id}`;
    primaryFields.forEach((field) => {
      if (field === 'birth') {
        insuredPlaceholderKey += moment(insured[field]).format('YYYYMMDD');
      } else {
        insuredPlaceholderKey += insured[field];
      }
    });
    insuredPlaceholderKey = `accept-insured:${md5(insuredPlaceholderKey)}`;

    // 执行占位
    // eslint-disable-next-line no-await-in-loop
    const setRst = await getRedis().setnx(insuredPlaceholderKey, '1');
    insuredPlaceholderKeys[insuredPlaceholderKey] = setRst;

    // 任意一个占位失败，表示有相关被保险人正在投保中
    if (setRst === 0) handing = true;
  }
  ctx.insuredPlaceholderKeys = insuredPlaceholderKeys;

  // 有被保险人正在投保中
  if (handing) {
    // 等待
    let totalWaitingTime = 0; // 总等待时长
    const waitingLimit = 10000; // 等待时长限制（毫秒）
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 随机等待一定的时长（可控范围内）
      const waitingTime = getRandomNum(200, 1000);
      totalWaitingTime += waitingTime;
      // eslint-disable-next-line no-await-in-loop
      await sleep(waitingTime);

      // 投保中的请求是否已完成
      let done = true;
      const keysArr = Object.keys(insuredPlaceholderKeys);
      for (let i = 0; i < keysArr.length; i += 1) {
        const key = keysArr[i];
        if (insuredPlaceholderKeys[key] === 0) {
          // eslint-disable-next-line no-await-in-loop
          const setAgainRst = await getRedis().setnx(key, '1');
          insuredPlaceholderKeys[key] = setAgainRst;
          if (setAgainRst === 0) done = false;
        }
      }
      if (done) break;

      // 总等待时长是否超过限制
      const over = totalWaitingTime > waitingLimit;
      if (over) {
        throw new AppError('服务超时，请稍候再试', {
          code: ErrorCodes.ServiceUnavailable,
          HTTPStatus: 503,
        });
      }
    }
  }

  // 查询重复投保的被保险人
  const repeatInsureds = await dao.queryRepeatInsureds({
    productId: product.id,
    productVersion: product.version,
    planId: plan.id,
    effectiveTime: policyData.effectiveTime,
    expiryTime: policyData.expiryTime,
    insureds: insureds.map((ins) => {
      const rst = {};
      primaryFields.forEach((field) => {
        rst[field] = ins[field];
      });
      return rst;
    }),
  });
  if (repeatInsureds && repeatInsureds.length > 0) {
    const details = [];
    for (let i = 0; i < insureds.length; i += 1) {
      const insured = insureds[i];

      const repeat = repeatInsureds.find((ins) => {
        let rst = true;
        primaryFields.forEach((field) => {
          if (insured[field] !== ins[field]) rst = false;
        });
        return rst;
      });

      if (repeat) {
        details.push({
          target: `insureds[${i}]`,
          message: primaryFields.map((pf) => repeat[pf]).join(' '),
        });
      }
    }
    throw error400('被保险人重复投保', {
      target: 'insureds',
      details,
    });
  }
};

/**
 * 计算保费
 * @param {object} ctx 上下文对象
 */
const charging = async (ctx) => {
  const { bizConfig, policyData } = ctx;
  const { calculateMode, formula, minimum, maximum } = bizConfig.accept.premium;

  // 计费
  if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    formulas[name](ctx, 'accept', params);
  }

  // 校验
  let totalPremium = 0;
  policyData.insureds.forEach((insured) => {
    totalPremium += insured.premium;
  });
  if (totalPremium !== policyData.premium) {
    if (calculateMode === 'adoptClient') {
      throw error400(`被保险人总保费不等于保单保费`);
    } else {
      throw error500(`被保险人总保费不等于保单保费`);
    }
  }
  if (policyData.premium < minimum) {
    throw error400(`保费不允许小于 ${minimum} 元`, {
      target: 'premium',
    });
  }
  if (policyData.premium > maximum) {
    throw error400(`保费不允许大于 ${maximum} 元`, {
      target: 'premium',
    });
  }
};

/**
 * 生成保单号
 * @param {object} ctx 上下文对象
 */
const generatePolicyNo = async (ctx) => {
  // 获取自增序号
  const incr = await getRedis().incr('policy-no-incr');

  // 生成保单号
  const date = moment().format('YYYYMMDD');
  const incrStr = `${incr}`.padStart(8, '0');
  const policyNo = `FOOINS${date}${incrStr}`;

  ctx.policyData.policyNo = policyNo;
  ctx.policyData.boundTime = moment().toISOString(true);
};

/**
 * 保存保单数据
 * @param {object} ctx 上下文对象
 */
const savePolicyData = async (ctx) => {
  const { policyData, producer, contract, product, plan, bizConfig } = ctx;

  // 组装保存的数据
  const saveData = { ...policyData };
  saveData.producerId = producer.id;
  saveData.contractId = contract.id;
  saveData.productId = product.id;
  saveData.productVersion = product.version;
  saveData.planId = plan.id;
  saveData.bizConfig = JSON.stringify(bizConfig);
  saveData.extensions = JSON.stringify(policyData.extensions);

  // 保存保单
  ctx.policyDataSaved = await dao.savePolicy(saveData);
};

/**
 * 组装响应数据
 * @param {object} ctx 上下文对象
 */
const assembleResponseData = (ctx) => {
  const { policyDataSaved, policyData, product } = ctx;
  const { policy, applicants, insureds } = policyDataSaved;

  return {
    orderNo: policy.orderNo,
    policyNo: policy.policyNo,
    contractCode: policyData.contractCode,
    contractVersion: policyData.contractVersion,
    productCode: product.code,
    productVersion: `${product.version}`,
    planCode: policyData.planCode,
    effectiveTime: policy.effectiveTime,
    expiryTime: policy.expiryTime,
    boundTime: policy.boundTime,
    premium: policy.premium,
    status: policy.status,
    extensions: { ...policyData.extensions },
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
 * 承保
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const acceptInsurance = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  try {
    // 基础校验
    await basalValidation(ctx, reqData, profile);
    if (ctx.responseData) {
      return { responseData: ctx.responseData, status: 200 };
    }

    // 业务规则校验
    await bizValidation(ctx, reqData);

    // 重复投保校验
    await repeatInsuredValidation(ctx);

    // 计费
    await charging(ctx);

    // 生成保单号
    await generatePolicyNo(ctx);

    // 保存数据
    await savePolicyData(ctx);

    // 组装响应数据
    const responseData = assembleResponseData(ctx);
    return { responseData, status: 201 };
  } finally {
    // 删除占位标识
    if (ctx.placeholderKey) {
      await getRedis().del(ctx.placeholderKey);
    }
    if (ctx.insuredPlaceholderKeys) {
      const keys = Object.keys(ctx.insuredPlaceholderKeys);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (ctx.insuredPlaceholderKeys[key] === 1) {
          // eslint-disable-next-line no-await-in-loop
          await getRedis().del(key);
        }
      }
    }
  }
};

module.exports = {
  acceptInsurance,
  basalValidation,
  bizValidation,
  charging,
};
