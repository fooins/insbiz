const _ = require('lodash');
const defaultConfig = require('./default');
const {
  getProductBizConfig,
  getPlanBizConfig,
  getContractBizConfig,
  getProducerBizConfig,
} = require('./dao');

/**
 * 获取业务规则配置
 * @param {object} options 选项
 * @returns {object} 业务规则配置
 */
module.exports = async function getBizConfig(options = {}) {
  const {
    productCode,
    productVersion,
    planCode,
    planVersion,
    producerCode,
    contractCode,
    contractVersion,
  } = options;

  // 获取产品中的配置
  let productConifg = {};
  if (productCode && productVersion) {
    productConifg = await getProductBizConfig(productCode, productVersion);
  }

  // 获取计划中的配置
  let planConifg = {};
  if (planCode && planVersion) {
    planConifg = await getPlanBizConfig(planCode, planVersion);
  }

  // 获取渠道中的配置
  let producerConifg = {};
  if (producerCode) {
    producerConifg = await getProducerBizConfig(producerCode);
  }

  // 获取契约中的配置
  let contractConifg = {};
  if (contractCode && contractVersion) {
    contractConifg = await getContractBizConfig(contractCode, contractVersion);
  }

  return _.merge(
    defaultConfig,
    productConifg,
    planConifg,
    producerConifg,
    contractConifg,
  );
};
