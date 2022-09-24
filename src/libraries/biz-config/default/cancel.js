module.exports = {
  // 是否允许退保
  allowCancel: true,
  // 保障期间相关
  period: {
    // 是否允许有效期内退保
    allowEffective: false,
    // 是否允许失效保单退保
    allowExpired: false,
  },
  // 计费相关
  premium: {
    // 计算方式
    // formula: 使用公式计算
    calculateMode: 'formula',
    // 公式
    formula: {
      // 名称
      name: 'default',
      // 参数
      params: {},
    },
  },
};
