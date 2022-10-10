const { Op } = require('sequelize');
const {
  getCompensationTaskModel,
  getClaimModel,
  getPolicyModel,
  getInsuredModel,
  getClaimInsuredModel,
} = require('../../models');
const { error500 } = require('../../libraries/utils');

/**
 * 查询待处理的赔付任务
 * @returns {array} 待处理的赔付任务
 */
const queryPendingCompensationTasks = async () => {
  const CompensationTask = getCompensationTaskModel();

  // 关联理赔单
  const Claim = getClaimModel();
  CompensationTask.belongsTo(Claim);

  // 关联保单
  const Policy = getPolicyModel();
  Claim.belongsTo(Policy);

  // 查询
  const compensationTasks = await CompensationTask.findAll({
    where: {
      status: 'pending',
      autoCompensate: 'enabled',
    },
    include: [
      {
        model: Claim,
        include: {
          model: Policy,
          attributes: { exclude: ['bizConfig'] },
        },
      },
    ],
    order: [['id', 'ASC']],
    limit: 10,
  });
  if (!compensationTasks) return compensationTasks;

  // 查询被保险人
  const allInsureds = await getInsuredModel().findAll({
    where: {
      policyId: {
        [Op.in]: compensationTasks.map((t) => t.Claim.Policy.id),
      },
    },
  });
  const insureds = await getClaimInsuredModel().findAll({
    where: {
      claimId: {
        [Op.in]: compensationTasks.map((t) => t.Claim.id),
      },
    },
  });

  // 数据处理
  compensationTasks.forEach((task, i) => {
    // 解析业务配置
    if (task.Claim.bizConfig) {
      try {
        compensationTasks[i].Claim.bizConfigParsed = JSON.parse(
          task.Claim.bizConfig,
        );
      } catch (error) {
        throw error500('理赔单数据有误(bizConfig)', { cause: error });
      }
    } else {
      compensationTasks[i].Claim.bizConfigParsed = {};
    }

    // 被保险人
    compensationTasks[i].Claim.Policy.insureds = allInsureds.filter(
      (ins) => ins.policyId === task.Claim.Policy.id,
    );
    compensationTasks[i].Claim.insureds = insureds.filter(
      (ins) => ins.claimId === task.Claim.id,
    );
  });

  return compensationTasks;
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
  await getCompensationTaskModel().update(
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

/**
 * 更新赔付任务
 * @param {object} values 需要更新的键值
 * @param {object} where 条件
 */
const updateCompensationTask = async (values, where) => {
  await getCompensationTaskModel().update(values, { where });
};

module.exports = {
  queryPendingCompensationTasks,
  handingTasks,
  updateCompensationTask,
};
