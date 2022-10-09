const _ = require('lodash');
const dao = require('./dao');

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
  // 写入开始处理时间
  await dao.updateCompensationTask({ handledAt: Date.now() }, { id: task.id });

  //
  //
  //
};

module.exports = async () => {
  // 查询待处理的任务
  const tasks = await queryPendingTasks();

  // 拆分批次
  const trunks = _.chunk(tasks, 10);

  // 分批执行处理
  for (let i = 0; i < trunks.length; i += 1) {
    const trunk = trunks[i];

    // eslint-disable-next-line no-await-in-loop
    await Promise.all(trunk.map((task) => compensation(task)));
  }
};
