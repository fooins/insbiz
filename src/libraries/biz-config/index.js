const _ = require('lodash');
const defaultConfig = require('./default');
const { error500 } = require('../utils');
const {
  getProductBizConfig,
  getPlanBizConfig,
  getContractBizConfig,
  getProducerBizConfig,
} = require('./dao');

/**
 * 解析业务规则配置信息
 * @param {string|object} bizConfig 业务规则配置信息
 * @returns {object} 业务配置信息对象
 */
const parseBizConfig = (bizConfig) => {
  if (typeof bizConfig === 'string') {
    try {
      return JSON.parse(bizConfig);
    } catch (error) {
      throw error500('业务规则配置信息有误(bizConfig)', { cause: error });
    }
  } else {
    return bizConfig || {};
  }
};

/**
 * 获取业务规则配置
 * @param {object} options 选项
 * @returns {object} 业务规则配置
 */
const getBizConfig = async (options) => {
  const { product, plan, producer, contract } = options;

  if (
    !product ||
    !plan ||
    !producer ||
    !contract ||
    ((!product.code || !product.version) && !product.bizConfig) ||
    ((!plan.code || !plan.version) && !plan.bizConfig) ||
    ((!contract.code || !contract.version) && !contract.bizConfig) ||
    (!producer.code && !producer.bizConfig)
  ) {
    throw error500('获取业务规则配置的参数有误');
  }

  // 获取产品中的配置
  let productConifg = {};
  if (product.bizConfig !== undefined) {
    productConifg = parseBizConfig(product.bizConfig);
  } else {
    productConifg = await getProductBizConfig(product.code, product.version);
  }

  // 获取计划中的配置
  let planConifg = {};
  if (plan.bizConfig !== undefined) {
    planConifg = parseBizConfig(plan.bizConfig);
  } else {
    planConifg = await getPlanBizConfig(plan.code, plan.version);
  }

  // 获取渠道中的配置
  let producerConifg = {};
  if (producer.bizConfig !== undefined) {
    producerConifg = parseBizConfig(producer.bizConfig);
  } else {
    producerConifg = await getProducerBizConfig(producer.code);
  }

  // 获取契约中的配置
  let contractConifg = {};
  if (contract.bizConfig !== undefined) {
    contractConifg = parseBizConfig(contract.bizConfig);
  } else {
    contractConifg = await getContractBizConfig(
      contract.code,
      contract.version,
    );
  }

  return _.merge(
    defaultConfig,
    productConifg,
    planConifg,
    producerConifg,
    contractConifg,
  );
};

module.exports = {
  getBizConfig,
};
