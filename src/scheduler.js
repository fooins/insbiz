const schedule = require('node-schedule');
const jobScripts = require('./jobs');
const { getJobModel } = require('./models');
const { AppError, ErrorCodes } = require('./libraries/error-handling');

// 所有作业
let jobs = [];

/**
 * 加载作业
 */
const loadJobs = async () => {
  const Job = getJobModel();
  const options = {
    where: { status: 'enable' },
  };

  // 检查作业数量
  const limit = 50;
  const count = await Job.count(options);
  if (count > limit) {
    throw new AppError(`作业数量超过 ${limit} 个的限制`, {
      code: ErrorCodes.InternalServerError,
      isTrusted: false,
    });
  }

  // 查询所有作业
  const findRst = await Job.findAll(options);
  if (findRst && findRst.length > 0) jobs = findRst;
};

/**
 * 调度所有作业
 */
const scheduleJob = async () => {
  // 加载作业
  await loadJobs();

  // 调度作业
  jobs.forEach((job, i) => {
    const { name, script, cron } = job;
    jobs[i].schedulerInstance = schedule.scheduleJob(
      name,
      cron,
      jobScripts[script],
    );
  });
};

/**
 * 取消所有作业调度
 */
const cancelJobs = async () => {
  jobs.forEach((job) => {
    const { schedulerInstance } = job;
    schedulerInstance.cancel();
  });
};

module.exports = {
  scheduleJob,
  cancelJobs,
};
