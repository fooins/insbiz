const getPolicy = async () => {};
const bizValidation = async () => {};
const generateEndorsementData = async () => {};
const charging = async () => {};
const generateEndorseNo = async () => {};
const saveEndorsementData = async () => {};
const assembleResponseData = async () => {};

/**
 * 批改保单
 * @param {object} reqData 请求参数
 * @param {object} profile 身份信息
 * @returns {object} 响应的数据
 */
const endorse = async (reqData, profile) => {
  // 定义一个上下文变量
  const ctx = {};

  // 查询保单;
  await getPolicy(ctx, reqData, profile);

  // 业务规则校验
  await bizValidation(ctx, reqData);

  // 生成批单数据
  await generateEndorsementData(ctx);

  // 计费
  await charging(ctx);

  // 生成批单号
  await generateEndorseNo(ctx);

  // 保存数据
  await saveEndorsementData(ctx);

  // 组装响应数据
  const responseData = assembleResponseData(ctx);

  return responseData;
};

module.exports = {
  endorse,
};
