const config = require('config');
const schema = require('./schema');

/**
 * 校验配置信息
 */
const validateConfigs = () => {
  // 获取所有配置项
  const keys = ['db', 'crypto', 'redis'];
  const values = {};
  keys.forEach((key) => {
    if (config.has(key)) {
      values[key] = config.get(key);
    }
  });

  // 执行校验
  const { error } = schema.validate(values, { abortEarly: false });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join('; '));
  }
};

module.exports = {
  validateConfigs,
};
