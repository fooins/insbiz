const config = require('config');
const Redis = require('ioredis');
const { handleError, AppError, ErrorCodes } = require('./error-handling');

let redis;

/**
 * 获取 Redis 实例
 */
const getRedis = () => {
  if (!redis) {
    redis = new Redis({
      host: config.get('redis.host'),
      port: config.get('redis.port'),
      password: config.get('redis.password'),
      db: config.get('redis.db'),
      keyPrefix: 'insbiz:',
    });

    redis.on('error', (error) => {
      handleError(
        new AppError(error.message, {
          code: ErrorCodes.InternalServerError,
          isTrusted: false,
          cause: error,
        }),
      );
    });
  }

  return redis;
};

module.exports = {
  getRedis,
};
