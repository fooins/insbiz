module.exports = {
  // 是否允许续保
  allowRenew: false,
  // 保障期间相关
  period: {
    // 取值类型
    // continue:延续原有保障长度
    type: 'continue',
  },
  // 保费相关
  premium: {
    // 取值类型
    // continue:延续原有保费 recalculate:重新计算
    type: 'recalculate',
  },
};
