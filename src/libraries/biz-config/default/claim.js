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
      // 允许的值
      options: ['idcard', 'passport'],
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
      // 允许的值
      options: ['man', 'female', 'other', 'unknown'],
    },
    // 出生日期
    birth: {
      // 是否必须
      required: true,
    },
    // 联系号码
    contactNo: {
      // 是否必须
      required: true,
    },
    // 电子邮箱地址
    email: {
      // 是否必须
      required: true,
    },
  },
  // 自动理赔相关
  autoClaim: {
    // 是否开启自动理赔
    enable: false,
    // 允许的最大保额
    maximum: 100.0,
    // 赔偿器
    compensator: 'default',
  },
};
