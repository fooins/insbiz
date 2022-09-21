const { Op } = require('sequelize');
const {
  getProducerModel,
  getPolicyModel,
  getContractModel,
  getProductModel,
  getPlanModel,
  getApplicantModel,
  getInsuredModel,
} = require('../../models');
const { getDbConnection } = require('../../libraries/data-access');
const { error500 } = require('../../libraries/utils');

/**
 * 通过渠道代码获取销售渠道信息
 * @param {string} code 渠道代码
 * @returns {object} 销售渠道信息
 */
const getProducerByCode = (code) =>
  getProducerModel().findOne({
    where: { code },
  });

/**
 * 通过订单号获取保单
 * @param {string} orderNo 订单号
 * @param {number} producerId 渠道ID
 * @param {object} options 选项
 * @returns {object} 保单信息
 */
const getPolicyByOrderNo = (orderNo, producerId, options = {}) =>
  getPolicyModel().findOne({
    where: { orderNo, producerId },
    attributes: options.attributes || undefined,
  });

/**
 * 通过契约代码获取契约信息
 * @param {string} code 契约代码
 * @param {number} version 契约版本号
 * @param {object} options 选项
 * @returns {object} 契约信息
 */
const getContractByCode = async (code, version, options = {}) => {
  const Contract = getContractModel();
  const params = {
    where: { code },
    order: [['version', 'DESC']],
  };

  // 指定版本号
  if (version) params.where.version = version;

  // 查询产品
  if (options.includeProduct) {
    const Product = getProductModel();
    Contract.belongsTo(Product);

    params.include = {
      model: Product,
      where: {
        version: {
          [Op.col]: 'Contract.productVersion',
        },
      },
    };
  }

  return Contract.findOne(params);
};

/**
 * 通过计划代码获取计划信息
 * @param {string} code 计划代码
 * @param {number} version 计划版本号（同产品版本号）
 * @returns {object} 计划信息
 */
const getPlanByCode = (code, version) =>
  getPlanModel().findOne({
    where: { code, version },
  });

/**
 * 保存保单
 * @param {object} saveData 需要保存的数据
 */
const savePolicy = async (saveData) => {
  // 创建事务
  const t = await getDbConnection().transaction();

  try {
    // 保存保单
    const policy = await getPolicyModel().create(saveData);

    // 保存投保人
    const applicants = await getApplicantModel().bulkCreate(
      saveData.applicants.map((applicant) => ({
        ...applicant,
        policyId: policy.id,
      })),
    );

    // 保存被保险人
    const insureds = await getInsuredModel().bulkCreate(
      saveData.insureds.map((insured) => ({
        ...insured,
        policyId: policy.id,
      })),
    );

    // 提交事务
    await t.commit();

    return {
      policy,
      applicants,
      insureds,
    };
  } catch (error) {
    // 回滚事务
    await t.rollback();

    // 抛出错误
    throw error;
  }
};

/**
 * 通过保单号获取保单信息
 * @param {string} policyNo 保单号
 * @param {object} options 选项
 * @returns {object} 保单信息
 */
const getPolicyByNo = async (policyNo, options = {}) => {
  const Policy = getPolicyModel();
  const params = {
    where: { policyNo },
    include: [],
  };
  if (options.attributes) params.attributes = options.attributes;

  // 查询授权
  if (options.includeContract) {
    const Contract = getContractModel();
    Policy.belongsTo(Contract);

    const include = {
      model: Contract,
    };
    if (options.includeContract.attributes) {
      include.attributes = options.includeContract.attributes;
    }

    params.include.push(include);
  }

  // 查询产品
  if (options.includeProduct) {
    const Product = getProductModel();
    Policy.belongsTo(Product);

    const include = {
      model: Product,
    };
    if (options.includeProduct.attributes) {
      include.attributes = options.includeProduct.attributes;
    }

    params.include.push(include);
  }

  // 查询计划
  if (options.includePlan) {
    const Plan = getPlanModel();
    Policy.belongsTo(Plan);

    const include = {
      model: Plan,
    };
    if (options.includePlan.attributes) {
      include.attributes = options.includePlan.attributes;
    }

    params.include.push(include);
  }

  // 查询保单
  const policy = await Policy.findOne(params);
  if (!policy) return policy;

  // 解析业务配置信息
  if (options.parseBizConfig && policy.bizConfig) {
    try {
      policy.bizConfigParsed = JSON.parse(policy.bizConfig);
    } catch (error) {
      throw error500('保单数据有误(bizConfig)', { cause: error });
    }
  }

  // 查询投保人
  if (options.queryApplicants) {
    policy.applicants = await getApplicantModel().findAll({
      where: { policyId: policy.id },
    });
  }

  // 查询被保险人
  if (options.queryInsureds) {
    policy.insureds = await getInsuredModel().findAll({
      where: { policyId: policy.id },
    });
  }

  return policy;
};

module.exports = {
  getPolicyByOrderNo,
  getProducerByCode,
  getContractByCode,
  getPlanByCode,
  savePolicy,
  getPolicyByNo,
};
