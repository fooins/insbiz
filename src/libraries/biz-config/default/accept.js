module.exports = {
  // 保障期间相关
  period: {
    // 是否必须
    required: true,
    // 生效时间相关
    effectiveTime: {
      // 精确到：
      // year:年 month:月 day:日 hour:时 minute:分 second:秒
      correctTo: 'day',
      // 默认值
      default: {
        // 相对于承保之时的
        // before:之前 after:之后
        relative: 'after',
        // 时间单位
        // year:年 month:月 day:日 hour:时 minute:分 second:秒
        unit: 'day',
        // 数量
        amount: 1,
      },
      // 允许的最小值（配置同默认值）
      minimum: {
        relative: 'after',
        unit: 'day',
        amount: 1,
      },
      // 允许的最大值（配置同默认值）
      maximum: {
        relative: 'after',
        unit: 'day',
        amount: 30,
      },
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 终止时间相关
    expiryTime: {
      // 精确到：
      // year:年 month:月 day:日 hour:时 minute:分 second:秒
      correctTo: 'second',
      // 默认值
      default: {
        // 相对于 **生效时间** 的
        // after:之后
        relative: 'after',
        // 时间单位
        // year:年 month:月 day:日 hour:时 minute:分 second:秒
        unit: 'day',
        // 数量
        amount: 1,
      },
      // 允许的最小值（配置同默认值）
      minimum: {
        relative: 'after',
        unit: 'day',
        amount: 1,
      },
      // 允许的最大值（配置同默认值）
      maximum: {
        relative: 'after',
        unit: 'year',
        amount: 1,
      },
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
  },
  // 保费相关
  premium: {
    // 计算方式
    // fixed: 固定值
    // adoptClient: 直接使用客户端指定的值
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
  // 投保人相关
  applicants: {
    // 姓名
    name: {
      // 是否必须
      required: true,
    },
    // 证件类型
    idType: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 允许的值
      options: ['idcard', 'passport'],
    },
    // 证件号码
    idNo: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 性别
    gender: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 允许的值
      options: ['man', 'female', 'other', 'unknown'],
      // 是否由身份证对应的值覆盖
      adoptIdCard: true,
    },
    // 出生日期
    birth: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 是否由身份证对应的值覆盖
      adoptIdCard: true,
      // 允许的最小年龄
      allowMinAge: {
        // year:周岁 month:月 day:日
        unit: 'year',
        // 年龄值
        value: 18,
      },
      // 允许的最大年龄
      allowMaxAge: {
        // year:周岁 month:月 day:日
        unit: 'year',
        // 年龄值
        value: 60,
      },
    },
    // 联系号码
    contactNo: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 电子邮箱地址
    email: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 默认投保人
    default: [],
    // 允许的最小投保人数
    minimum: 1,
    // 允许的最大投保人数
    maximum: 1,
  },
  // 被保险人相关
  insureds: {
    // 与投保人关系
    relationship: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 允许的值
      options: ['self', 'parents', 'brothers', 'sisters'],
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
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 允许的值
      options: ['idcard', 'passport'],
    },
    // 证件号码
    idNo: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 性别
    gender: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 允许的值
      options: ['man', 'female', 'other', 'unknown'],
      // 是否由身份证对应的值覆盖
      adoptIdCard: true,
    },
    // 出生日期
    birth: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
      // 是否由身份证对应的值覆盖
      adoptIdCard: true,
      // 允许的最小年龄
      allowMinAge: {
        // year:周岁 month:月 day:日
        unit: 'year',
        // 年龄值
        value: 18,
      },
      // 允许的最大年龄
      allowMaxAge: {
        // year:周岁 month:月 day:日
        unit: 'year',
        // 年龄值
        value: 60,
      },
    },
    // 联系号码
    contactNo: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 电子邮箱地址
    email: {
      // 是否必须
      required: true,
      // 默认值
      default: null,
      // 是否允许客户端进行设置
      allowClientToSet: true,
    },
    // 允许的最小被保险人数
    minimum: 1,
    // 允许的最大被保险人数
    maximum: 99,
  },
};
