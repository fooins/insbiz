const { Op } = require('sequelize');
const { getNotifyTaskModel, getSecretModel } = require('../../models');

/**
 * 更新通知任务
 * @param {object} values 需要更新的键值
 * @param {object} where 条件
 */
const updateNotifyTask = async (values, where) => {
  await getNotifyTaskModel().update(values, { where });
};

/**
 * 查询待处理的通知任务
 * @returns {array} 待处理的通知任务
 */
const queryPendingNotifyTasks = async () => {
  const NotifyTask = getNotifyTaskModel();

  // 关联密钥
  const Secret = getSecretModel();
  NotifyTask.belongsTo(Secret, {
    targetKey: 'producerId',
    foreignKey: 'producerId',
  });

  // 查询
  const notifyTasks = await NotifyTask.findAll({
    where: {
      status: {
        [Op.in]: ['pending', 'retry'],
      },
    },
    include: Secret,
    order: [['id', 'ASC']],
    limit: 20,
  });

  return notifyTasks;
};

/**
 * 开始处理任务
 * @param {array} tasks 任务清单
 */
const handingTasks = async (tasks) => {
  if (!tasks || tasks.length <= 0) return;

  // 任务ID
  const taskIds = tasks.map((t) => t.id);

  // 更新任务状态为处理中
  await getNotifyTaskModel().update(
    { status: 'handing' },
    {
      where: {
        id: {
          [Op.in]: taskIds,
        },
      },
    },
  );
};

module.exports = {
  updateNotifyTask,
  queryPendingNotifyTasks,
  handingTasks,
};
