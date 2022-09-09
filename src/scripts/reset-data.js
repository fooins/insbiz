const syncModels = require('../models/sync');
const { getProducerModel, getSecretModel } = require('../models');
const { aesEncrypt } = require('../libraries/crypto');

/**
 * 先清空数据并同步所有模型
 * 然后添加样本数据
 */
const resetData = async () => {
  // 重置表结构和数据
  await syncModels({ force: true });

  // 创建销售渠道
  await getProducerModel().create({
    name: '销售渠道001',
    code: '1001',
  });
  // 查询渠道
  const producer = await getProducerModel().findOne({
    where: { code: '1001' },
  });

  // 创建密钥
  await getSecretModel().create({
    secretId: 'd73d0a29-0bea-42e5-a8a6-211bb998f8b5',
    secretKey: aesEncrypt('n8Ih%mA9PL^X)%MN2e%cO(9=Uhczf7n+'),
    producerId: producer.id,
  });
};

resetData()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('添加样本数据成功');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error.message);
  })
  .finally(() => {
    process.exit();
  });
