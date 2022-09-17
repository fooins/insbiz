const { Op } = require('sequelize');
const {
  getProducerModel,
  getPolicyModel,
  getContractModel,
  getProductModel,
  getPlanModel,
} = require('../../models');

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

module.exports = {
  getPolicyByOrderNo,
  getProducerByCode,
  getContractByCode,
  getPlanByCode,
};
