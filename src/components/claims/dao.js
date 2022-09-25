const {
  getPolicyModel,
  getContractModel,
  getProductModel,
  getPlanModel,
  getApplicantModel,
  getInsuredModel,
  getClaimModel,
  getClaimInsuredModel,
} = require('../../models');
const { error500 } = require('../../libraries/utils');
const { getDbConnection } = require('../../libraries/data-access');

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

/**
 * 保存理赔单
 * @param {object} saveData 需要保存的数据
 */
const saveClaims = async (saveData) => {
  // 创建事务
  const t = await getDbConnection().transaction();

  try {
    const { claimData } = saveData;

    // 生成理赔单
    const claim = await getClaimModel().create(claimData, {
      transaction: t,
    });

    // 生成理赔单被保险人
    const claimInsureds = await getClaimInsuredModel().bulkCreate(
      claimData.insureds.map((insured) => ({
        ...insured,
        claimId: claim.id,
      })),
      { transaction: t },
    );

    // 提交事务
    await t.commit();

    return {
      claim,
      claimInsureds,
    };
  } catch (error) {
    // 回滚事务
    await t.rollback();

    // 抛出错误
    throw error;
  }
};

/**
 * 通过理赔单号获取理赔单信息
 * @param {string} claimNo 理赔单号
 * @param {object} options 选项
 * @returns {object} 理赔单信息
 */
const getClaimByNo = async (claimNo, options = {}) => {
  const Claim = getClaimModel();
  const params = {
    where: { claimNo },
    include: [],
  };
  if (options.attributes) params.attributes = options.attributes;

  // 查询保单
  if (options.includePolicy) {
    const Policy = getPolicyModel();
    Claim.belongsTo(Policy);

    const include = {
      model: Policy,
    };
    if (options.includePolicy.attributes) {
      include.attributes = options.includePolicy.attributes;
    }

    params.include.push(include);
  }

  // 查询理赔单
  const claim = await Claim.findOne(params);
  if (!claim) return claim;

  // 查询被保险人
  if (options.queryInsureds) {
    claim.insureds = await getClaimInsuredModel().findAll({
      where: { claimId: claim.id },
    });
  }

  return claim;
};

/**
 * 查询理赔单
 * @param {object} params 选项
 * @returns {array} 理赔单列表
 */
const queryClaim = async (params = {}) => getClaimModel().findOne(params);

module.exports = {
  getPolicyByNo,
  saveClaims,
  getClaimByNo,
  queryClaim,
};
