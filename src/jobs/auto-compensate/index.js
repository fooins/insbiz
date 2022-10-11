const _ = require('lodash');
const dao = require('./dao');
const formulas = require('../../libraries/formulas');
const { error500, hasOwnProperty } = require('../../libraries/utils');

/**
 * 查询待处理的任务
 * @returns {array} 待处理的任务
 */
const queryPendingTasks = async () => {
  // 查询待处理的任务
  const tasks = await dao.queryPendingCompensationTasks();

  // 更新状态为处理中
  await dao.handingTasks(tasks);

  return tasks;
};

/**
 * 执行赔付
 * @param {object} task 赔付任务
 */
const compensation = async (task) => {
  const { Claim: claim } = task;
  const { premium, autoCompensate } = claim.bizConfigParsed;
  const { calculateMode, formula, fixed } = premium;
  const { maximum } = autoCompensate;

  // 写入开始处理时间
  await dao.updateCompensationTask({ handledAt: Date.now() }, { id: task.id });

  // 计算保额
  if (calculateMode === 'fixed') {
    claim.sumInsured = 0;
    claim.insureds.forEach((insured, i) => {
      claim.insureds[i].sumInsured = fixed;
      claim.sumInsured += fixed;
    });
  } else if (calculateMode === 'formula') {
    const { name, params } = formula;

    if (
      !hasOwnProperty(formulas, name) ||
      typeof formulas[name] !== 'function'
    ) {
      throw error500('计费公式有误');
    }

    const ctx = {
      claim,
      policy: claim.Policy,
    };
    formulas[name](ctx, 'claim', params);
    claim.sumInsured = ctx.claim.sumInsured;
    claim.insureds = ctx.claim.insureds;
  }

  // 保额校验
  let totalSumInsured = 0;
  claim.insureds.forEach((insured) => {
    totalSumInsured += insured.sumInsured;
  });
  if (totalSumInsured !== claim.sumInsured) {
    throw error500(`计费错误，被保险人总保额不等于理赔单总保额`);
  }
  if (claim.sumInsured > maximum) {
    throw error500('赔付金额大于允许的范围');
  }

  // 理赔成功，更新相关数据
  await dao.compensationSuccessed({ claim, task });
};

/**
 * 执行处理
 * @param {object} task 赔付任务
 */
const handler = async (task) => {
  try {
    await compensation(task);
  } catch (error) {
    // 处理失败记录原因
    await dao.updateCompensationTask(
      {
        status: 'failure',
        finishedAt: Date.now(),
        failureReasons: JSON.stringify({
          message: error.message,
          stack: error.stack,
          ...error,
        }),
      },
      { id: task.id },
    );
  }
};

module.exports = async () => {
  // 查询待处理的任务
  const tasks = await queryPendingTasks();

  // 拆分批次
  const trunks = _.chunk(tasks, 10);

  // 分批执行处理
  for (let i = 0; i < trunks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(trunks[i].map((task) => handler(task)));
  }
};
