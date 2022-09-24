module.exports = {
  // 是否允许批改
  allowEndorse: true,
  // 保单信息相关
  policy: {
    // 是否允许批改
    allowEndorse: true,
    // 计划相关
    plan: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 保单生效时间相关
    effectiveTime: {
      // 是否允许批改
      allowEndorse: true,
      // 允许的最小值
      minimum: {
        // 相对于原值
        // before:之前 after:之后
        relative: 'after',
        // 时间单位
        // year:年 month:月 day:日 hour:时 minute:分 second:秒
        unit: 'second',
        // 数量
        amount: 1,
      },
      // 允许的最大值
      maximum: {
        // 相对于原值
        // before:之前 after:之后
        relative: 'after',
        // 时间单位
        // year:年 month:月 day:日 hour:时 minute:分 second:秒
        unit: 'day',
        // 数量
        amount: 30,
      },
    },
    // 保单终止时间相关
    expiryTime: {
      // 是否允许批改
      allowEndorse: true,
      // 允许的最小值
      minimum: {
        // 相对于原值
        // before:之前 after:之后
        relative: 'before',
        // 时间单位
        // year:年 month:月 day:日 hour:时 minute:分 second:秒
        unit: 'day',
        // 数量
        amount: 30,
      },
      // 允许的最大值
      maximum: {
        // 相对于原值
        // before:之前 after:之后
        relative: 'after',
        // 时间单位
        // year:年 month:月 day:日 hour:时 minute:分 second:秒
        unit: 'day',
        // 数量
        amount: 30,
      },
    },
  },
  // 投保人相关
  applicants: {
    // 是否允许批改
    allowEndorse: true,
    // 允许批改的最大投保人数
    maximum: 10,
    // 姓名相关
    name: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 证件类型相关
    idType: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 证件号码相关
    idNo: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 性别相关
    gender: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 出生日期相关
    birth: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 联系号码相关
    contactNo: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 电子邮箱地址
    email: {
      // 是否允许批改
      allowEndorse: true,
    },
  },
  // 被保险人相关
  insureds: {
    // 是否允许批改
    allowEndorse: true,
    // 允许批改的最大被保险人数
    maximum: 10,
    // 与投保人关系相关
    relationship: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 姓名相关
    name: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 证件类型相关
    idType: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 证件号码相关
    idNo: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 性别相关
    gender: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 出生日期相关
    birth: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 联系号码相关
    contactNo: {
      // 是否允许批改
      allowEndorse: true,
    },
    // 电子邮箱地址
    email: {
      // 是否允许批改
      allowEndorse: true,
    },
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
      params: {
        // 计费因子：保障天数
        days: {
          // 保障天数区间
          ranges: [
            {
              // 区间开始（包含）
              start: 0,
              // 区间结束（包含）
              end: 10,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 10,
            },
            {
              // 区间开始（包含）
              start: 11,
              // 区间结束（包含）
              end: 365,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 20,
            },
          ],
        },
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
              value: 5,
            },
            {
              // 区间开始（包含）
              start: 19,
              // 区间结束（包含）
              end: 200,
              // 操作符 (加:add 减:subtract 乘:multiply)
              operator: 'add',
              // 值
              value: 15,
            },
          ],
        },
      },
    },
    // 允许的最小批减费用
    minimum: -1000.0,
    // 允许的最大批增费用
    maximum: 1000.0,
  },
};
