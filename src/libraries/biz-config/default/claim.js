module.exports = {
  // 计费相关
  premium: {
    // 计算方式
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
        // 计费因子：被保险人年龄
        insuredAge: {
          // 被保险人年龄区间
          ranges: [
            {
              // 区间开始（包含）
              start: 0,
              // 区间结束（包含）
              end: 18,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 100000,
            },
            {
              // 区间开始（包含）
              start: 19,
              // 区间结束（包含）
              end: 200,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 50000,
            },
          ],
        },
      },
    },
  },
  // 被保险人相关
  insureds: {
    // 编号
    no: {
      // 是否必须
      required: true,
    },
    // 与投保人关系
    relationship: {
      // 是否必须
      required: true,
    },
    // 姓名
    name: {
      // 是否必须
      required: true,
    },
    // 证件类型
    idType: {
      // 是否必须
      required: true,
    },
    // 证件号码
    idNo: {
      // 是否必须
      required: true,
    },
    // 性别
    gender: {
      // 是否必须
      required: true,
    },
    // 出生日期
    birth: {
      // 是否必须
      required: true,
    },
  },
  // 自动赔付相关
  autoCompensate: {
    // 是否开启自动赔付
    enable: false,
    // 允许的最大赔付金额（保额）
    maximum: 100.0,
    // 赔付器
    compensator: 'default',
  },
};
