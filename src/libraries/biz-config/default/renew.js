module.exports = {
  // 是否允许续保
  allowRenew: false,
  // 保障期间相关
  period: {
    // 取值方式
    // continue:延续原有保障长度
    mode: 'continue',
  },
  // 保费相关
  premium: {
    // 计算方式
    // continue:延续原有保费
    // fixed: 固定值
    // formula: 使用公式计算
    calculateMode: 'formula',
    // 固定值
    fixed: 0.0,
    // 公式
    formula: {
      // 名称
      name: 'default',
      // 参数
      params: {
        // 基数
        cardinal: 0,
        // 计费因子：保障天数
        days: {
          // 保障天数区间
          ranges: [
            {
              // 区间开始
              start: 0,
              // 区间结束
              end: 10,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 10,
            },
          ],
        },
        // 计费因子：被保险人年龄
        insuredAge: {
          // 被保险人年龄区间
          ranges: [
            {
              // 区间开始
              start: 0,
              // 区间结束
              end: 18,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 5,
            },
          ],
        },
      },
    },
    // 允许的最小值
    minimum: 0.0,
    // 允许的最大值
    maximum: 9999.0,
  },
};
