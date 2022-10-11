const moment = require('moment');

/**
 * 计算保费（承保）
 * @param {object} ctx 上下文对象
 * @param {object} params 计算参数
 */
const calPremiumAccept = (ctx, params) => {
  const { policyData } = ctx;
  const { cardinal, days, insuredAge } = params;

  // 计算保障天数
  let insDays = 0;
  if (days) {
    const { effectiveTime, expiryTime } = policyData;
    insDays = Math.abs(moment(expiryTime).diff(effectiveTime, 'days'));
  }

  // 循环处理每个被保险人
  let totalPremium = 0;
  policyData.insureds.forEach((insured, idx) => {
    // 保费
    let premium = cardinal;

    // 根据保障天数计费
    if (days) {
      // 遍历区间
      days.ranges.forEach((range) => {
        const { start, end, operator, value } = range;
        if (insDays >= start && insDays <= end) {
          if (operator === 'add') {
            premium += value;
          } else if (operator === 'subtract') {
            premium -= value;
          } else if (operator === 'multiply') {
            premium *= value;
          }
        }
      });
    }

    // 根据被保险人年龄计费
    if (insuredAge) {
      // 计算被保险人年龄
      const { effectiveTime } = policyData;
      const { birth } = insured;
      const age = Math.abs(moment(effectiveTime).diff(birth, 'years'));

      // 遍历区间
      insuredAge.ranges.forEach((range) => {
        const { start, end, operator, value } = range;
        if (age >= start && age <= end) {
          if (operator === 'add') {
            premium += value;
          } else if (operator === 'subtract') {
            premium -= value;
          } else if (operator === 'multiply') {
            premium *= value;
          }
        }
      });
    }

    // 设置被保险人保费
    policyData.insureds[idx].premium = premium;

    // 累计总保费
    totalPremium += premium;
  });

  // 设置总保费
  policyData.premium = totalPremium;
};

/**
 * 计算保费（续保）
 * @param {object} ctx 上下文对象
 * @param {object} params 计算参数
 */
const calPremiumRenew = (ctx, params) => {
  const { newPolicyData } = ctx;
  const { cardinal, days, insuredAge } = params;

  // 计算保障天数
  let insDays = 0;
  if (days) {
    const { effectiveTime, expiryTime } = newPolicyData;
    insDays = Math.abs(moment(expiryTime).diff(effectiveTime, 'days'));
  }

  // 循环处理每个被保险人
  let totalPremium = 0;
  newPolicyData.insureds.forEach((insured, idx) => {
    // 保费
    let premium = cardinal;

    // 根据保障天数计费
    if (days) {
      // 遍历区间
      days.ranges.forEach((range) => {
        const { start, end, operator, value } = range;
        if (insDays >= start && insDays <= end) {
          if (operator === 'add') {
            premium += value;
          } else if (operator === 'subtract') {
            premium -= value;
          } else if (operator === 'multiply') {
            premium *= value;
          }
        }
      });
    }

    // 根据被保险人年龄计费
    if (insuredAge) {
      // 计算被保险人年龄
      const { effectiveTime } = newPolicyData;
      const { birth } = insured;
      const age = Math.abs(moment(effectiveTime).diff(birth, 'years'));

      // 遍历区间
      insuredAge.ranges.forEach((range) => {
        const { start, end, operator, value } = range;
        if (age >= start && age <= end) {
          if (operator === 'add') {
            premium += value;
          } else if (operator === 'subtract') {
            premium -= value;
          } else if (operator === 'multiply') {
            premium *= value;
          }
        }
      });
    }

    // 设置被保险人保费
    newPolicyData.insureds[idx].premium = premium;

    // 累计总保费
    totalPremium += premium;
  });

  // 设置总保费
  newPolicyData.premium = totalPremium;
};

/**
 * 计算保费（批改）
 * @param {object} ctx 上下文对象
 * @param {object} params 计算参数
 */
const calPremiumEndorse = (ctx, params) => {
  // 同承保计费

  const context = {
    ...ctx,
    policyData: ctx.newPolicy,
  };
  calPremiumAccept(context, {
    cardinal: 0,
    ...params,
  });

  ctx.newPolicy = context.policyData;
};

/**
 * 计算保费（退保）
 * @param {object} ctx 上下文对象
 * @param {object} params 计算参数
 */
const calPremiumCancel = (ctx) => {
  const { policy, newPolicyData } = ctx;
  const { effectiveTime, expiryTime } = policy;

  // 生效中
  if (
    moment(effectiveTime).isBefore(moment()) &&
    moment(expiryTime).isAfter(moment())
  ) {
    // 保单区间（秒数）
    const duration = moment(expiryTime).diff(moment(effectiveTime), 'second');
    // 已经生效的区间（秒数）
    const durationEffective = moment().diff(moment(effectiveTime), 'second');

    let totalPremium = 0;
    policy.insureds.forEach((insured) => {
      const premium = (durationEffective * insured.premium) / duration;
      totalPremium += premium;
      newPolicyData.insureds.push({
        no: insured.no,
        premium,
      });
    });
    newPolicyData.premium = totalPremium;
  }
  // 生效前|生效中
  else {
    // 全退
    newPolicyData.premium = 0;
    policy.insureds.forEach((insured) => {
      newPolicyData.insureds.push({
        no: insured.no,
        premium: 0,
      });
    });
  }
};

/**
 * 计算理赔赔付金额
 * @param {object} ctx 上下文对象
 * @param {object} params 计算参数
 */
const calPremiumClaim = (ctx, params) => {
  const { policy, claim } = ctx;
  const { cardinal, insuredAge } = params;

  // 循环处理每个被保险人
  let totalSumInsured = 0;
  claim.insureds.forEach((insured, idx) => {
    // 保单中对应的被保险人
    const policyInsured = policy.insureds.find((i) => i.no === insured.no);
    // 保额
    let sumInsured = cardinal;

    // 根据被保险人年龄计费
    if (insuredAge) {
      // 计算被保险人年龄
      const { effectiveTime } = policy;
      const { birth } = policyInsured;
      const age = Math.abs(moment(effectiveTime).diff(birth, 'years'));

      // 遍历区间
      insuredAge.ranges.forEach((range) => {
        const { start, end, operator, value } = range;
        if (age >= start && age <= end) {
          if (operator === 'add') {
            sumInsured += value;
          } else if (operator === 'subtract') {
            sumInsured -= value;
          } else if (operator === 'multiply') {
            sumInsured *= value;
          }
        }
      });
    }

    // 设置被保险人保额
    claim.insureds[idx].sumInsured = sumInsured;

    // 累计总保额
    totalSumInsured += sumInsured;
  });

  // 设置总保额
  claim.sumInsured = totalSumInsured;
};

/**
 * 计算保费
 * @param {object} ctx 上下文对象
 * @param {string} bizType 业务类型
 * @param {object} params 计算参数
 */
module.exports = function calculationPremium(ctx, bizType, params = {}) {
  // 承保
  if (bizType === 'accept') {
    calPremiumAccept(ctx, params);
  }
  // 续保
  else if (bizType === 'renew') {
    calPremiumRenew(ctx, params);
  }
  // 批改
  else if (bizType === 'endorse') {
    calPremiumEndorse(ctx, params);
  }
  // 退保
  else if (bizType === 'cancel') {
    calPremiumCancel(ctx, params);
  }
  // 理赔
  else if (bizType === 'claim') {
    calPremiumClaim(ctx, params);
  }
};
