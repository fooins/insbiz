const moment = require('moment');

/**
 * 计算保费
 * @param {object} ctx 上下文对象
 * @param {object} params 计算参数
 */
module.exports = function calculationPremium(ctx, params = {}) {
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
      const age = Math.abs(moment(effectiveTime).diff(birth, 'days'));

      // 遍历区间
      days.ranges.forEach((range) => {
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
