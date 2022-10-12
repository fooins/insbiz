const _ = require('lodash');
const moment = require('moment');
const dao = require('./dao');

/**
 * 查询待处理的任务
 * @returns {array} 待处理的任务
 */
const queryPendingTasks = async () => {
  // 查询待处理的任务
  const tasks = await dao.queryPendingNotifyTasks();

  // 更新状态为处理中
  await dao.handingTasks(tasks);

  return tasks;
};

/**
 * 执行通知
 * @param {object} task 通知任务
 */
const notify = async (task) => {
  // 更新任务
  await dao.updateCompensationTask(
    {
      handledAt: Date.now(),
      retries: task.status === 'pending' ? 0 : task.retries + 1,
    },
    { id: task.id },
  );

  //
  //
  //
  //
  //
  //
  //
  //
};

/**
 * 执行处理
 * @param {object} task 任务
 */
const handler = async (task) => {
  try {
    await notify(task);
  } catch (error) {
    // 重试间隔
    const retryInterval = {
      0: { amount: 15, unit: 'seconds' },
      1: { amount: 30, unit: 'seconds' },
      2: { amount: 3, unit: 'minutes' },
      3: { amount: 10, unit: 'minutes' },
      4: { amount: 20, unit: 'minutes' },
      5: { amount: 30, unit: 'minutes' },
      6: { amount: 60, unit: 'minutes' },
      7: { amount: 3, unit: 'hours' },
      8: { amount: 6, unit: 'hours' },
      9: { amount: 24, unit: 'hours' },
    };

    // 处理失败记录原因
    await dao.updateNotifyTask(
      {
        status: task.retries > 9 ? 'failure' : 'retry',
        finishedAt: Date.now(),
        failureReasons: JSON.stringify({
          message: error.message,
          stack: error.stack,
          ...error,
        }),
        retryAt: retryInterval[task.retries]
          ? moment().add(
              retryInterval[task.retries].amount,
              retryInterval[task.retries].unit,
            )
          : null,
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
