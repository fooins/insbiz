const evn = require('../libraries/env');
const { getDbConnection } = require('../libraries/data-access');
const {
  getProducerModel,
  getSecretModel,
  getContractModel,
  getPlanModel,
  getProductModel,
  getPolicyModel,
  getApplicantModel,
  getInsuredModel,
  getEndorsementModel,
  getEndorsementDetailModel,
  getPolicySnapshootModel,
  getClaimModel,
  getClaimInsuredModel,
} = require('./index');

/**
 * 同步所有模型到数据库
 * @param {object} options 同步选项
 */
module.exports = async function syncModels(options = {}) {
  if (evn.isProd()) throw new Error('不允许生产环境执行！');

  const { force = false, alter = false } = options;

  // 定义模型
  getProducerModel();
  getSecretModel();
  getContractModel();
  getPlanModel();
  getProductModel();
  getPolicyModel();
  getApplicantModel();
  getInsuredModel();
  getEndorsementModel();
  getEndorsementDetailModel();
  getPolicySnapshootModel();
  getClaimModel();
  getClaimInsuredModel();

  // 将模型同步到数据库（创建对应表）
  await getDbConnection().sync({
    // 如果已经存在对应表则先删除它
    force,
    // 修改表以适应模型
    alter,
  });
};
