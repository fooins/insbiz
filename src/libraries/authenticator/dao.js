const { getSecretModel, getProducerModel } = require('../../models');

/**
 * 通过密钥标识获取密钥信息
 * @param {string} secretId 密钥标识
 * @returns {object} 密钥信息
 */
const getSecretBySecretId = async (secretId) => {
  const Producer = getProducerModel();
  const Secret = getSecretModel();

  Secret.belongsTo(Producer);

  return Secret.findOne({
    where: { secretId },
    include: Producer,
  });
};

module.exports = {
  getSecretBySecretId,
};
