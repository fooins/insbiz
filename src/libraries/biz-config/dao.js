const {
  getProducerModel,
  getContractModel,
  getPlanModel,
  getProductModel,
} = require('../../models');

/**
 * 获取产品中的业务规则配置
 * @param {string} productCode 产品代码
 * @param {integer} productVersion 产品版本号
 * @returns {object} 业务规则配置
 */
const getProductBizConfig = async (productCode, productVersion) => {
  const product = getProductModel().findOne({
    attributes: ['bizConfig'],
    where: { code: productCode, version: productVersion },
  });

  if (!product) {
    return {};
  }
  return JSON.parse(product.bizConfig);
};

/**
 * 获取计划中的业务规则配置
 * @param {string} planCode 计划代码
 * @param {integer} planVersion 计划版本号
 * @returns {object} 业务规则配置
 */
const getPlanBizConfig = async (planCode, planVersion) => {
  const plan = getPlanModel().findOne({
    attributes: ['bizConfig'],
    where: { code: planCode, version: planVersion },
  });

  if (!plan) {
    return {};
  }
  return JSON.parse(plan.bizConfig);
};

/**
 * 获取授权契约中的业务规则配置
 * @param {string} contractCode 契约代码
 * @param {integer} contractVersion 契约版本号
 * @returns {object} 业务规则配置
 */
const getContractBizConfig = async (contractCode, contractVersion) => {
  const contract = getContractModel().findOne({
    attributes: ['bizConfig'],
    where: { code: contractCode, version: contractVersion },
  });

  if (!contract) {
    return {};
  }
  return JSON.parse(contract.bizConfig);
};

/**
 * 获取销售渠道中的业务规则配置
 * @param {string} producerCode 契约代码
 * @returns {object} 业务规则配置
 */
const getProducerBizConfig = async (producerCode) => {
  const producer = getProducerModel().findOne({
    attributes: ['bizConfig'],
    where: { code: producerCode },
  });

  if (!producer) {
    return {};
  }

  return JSON.parse(producer.bizConfig);
};

module.exports = {
  getProductBizConfig,
  getPlanBizConfig,
  getContractBizConfig,
  getProducerBizConfig,
};