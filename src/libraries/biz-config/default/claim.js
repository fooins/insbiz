module.exports = {
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
};
