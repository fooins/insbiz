const syncModels = require('../models/sync');
const {
  getProducerModel,
  getSecretModel,
  getContractModel,
  getPlanModel,
  getProductModel,
  getJobModel,
} = require('../models');
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
    code: 'PC1001',
  });
  // 查询渠道
  const producer = await getProducerModel().findOne({
    where: { code: 'PC1001' },
  });

  // 创建密钥
  await getSecretModel().create({
    secretId: 'd73d0a29-0bea-42e5-a8a6-211bb998f8b5',
    secretKey: aesEncrypt('n8Ih%mA9PL^X)%MN2e%cO(9=Uhczf7n+'),
    producerId: producer.id,
  });

  // 创建保险产品
  await getProductModel().create({
    name: '保险产品001',
    code: 'PD001',
    version: 1,
    bizConfig: JSON.stringify({
      renew: { allowRenew: true },
    }),
  });
  // 查询保险产品
  const product = await getProductModel().findOne({
    where: { code: 'PD001' },
  });

  // 创建保险计划
  await getPlanModel().create({
    name: '保险计划001',
    code: 'PL001',
    version: 1,
    productId: product.id,
  });

  // 创建授权契约
  await getContractModel().create({
    code: 'C001',
    version: 1,
    producerId: producer.id,
    productId: product.id,
    productVersion: product.version,
  });

  // 创建作业
  await getJobModel().bulkCreate([
    {
      name: 'autoClaim',
      description: '执行自动理赔',
      status: 'enable',
      script: 'autoClaim',
      cron: '*/10 * * * * *',
    },
  ]);
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
