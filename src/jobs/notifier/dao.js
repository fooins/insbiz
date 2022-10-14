const { Op } = require('sequelize');
const {
  getNotifyTaskModel,
  getSecretModel,
  getProducerModel,
} = require('../../models');
const { error500 } = require('../../libraries/utils');

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

  // 关联渠道
  const Producer = getProducerModel();
  NotifyTask.belongsTo(Producer);

  // 查询
  const notifyTasks = await NotifyTask.findAll({
    where: {
      [Op.or]: [
        {
          status: 'pending',
        },
        {
          status: 'retry',
          retryAt: {
            [Op.lt]: Date.now(),
          },
        },
      ],
    },
    include: Producer,
    order: [['id', 'ASC']],
    limit: 20,
  });
  if (!notifyTasks || !notifyTasks.length) return notifyTasks;

  // 查询密钥
  const allSecret = await getSecretModel().findAll({
    where: {
      producerId: {
        [Op.in]: notifyTasks.map((t) => t.producerId),
      },
    },
    group: 'producerId',
  });

  // 数据处理
  notifyTasks.forEach((task, i) => {
    // 解析数据
    if (task.data) {
      try {
        notifyTasks[i].dataParsed = JSON.parse(task.data);
      } catch (error) {
        throw error500('通知任务数据有误(data)', { cause: error });
      }
    } else {
      notifyTasks[i].dataParsed = {};
    }

    // 密钥
    notifyTasks[i].Secrets = allSecret.filter(
      (s) => s.producerId === task.producerId,
    );
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
