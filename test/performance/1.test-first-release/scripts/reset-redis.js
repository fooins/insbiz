/* eslint-disable no-console */

const { getRedis } = require('../../../../src/libraries/redis');

/**
 * 重置 Redis
 * @returns {array}
 */
const resetRedis = async () => {
  const rst = await getRedis().flushall();
  if (rst !== 'OK') throw new Error('Redis 清除失败');
};

resetRedis()
  .then(() => {
    console.info('Redis 清除成功');
  })
  .catch((error) => {
    console.error(error);
    console.error(error.message);
  });
