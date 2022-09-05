const rTracer = require('cls-rtracer');

/**
 * 响应成功结果。
 * @param {object} ctx 请求上下文
 * @param {object} data 响应数据
 * @param {object} options 其他选项
 */
const respSucc = (ctx, data = {}, options = {}) => {
  const {
    status = 200, // HTTP 状态代码
    headers = {}, // HTTP 响应标头
  } = options;

  ctx.body = data;
  ctx.status = status;
  ctx.set({
    'X-Ins-Trace-Id': rTracer.id(),
    ...headers,
  });
};

/**
 * 响应失败结果。
 * @param {object} ctx 请求上下文
 * @param {string} code 错误代码
 * @param {string} message 错误消息
 * @param {object} options 其他选项
 */
const respFail = (ctx, code, message, options = {}) => {
  const {
    status = 404, // HTTP 状态代码
    headers = {}, // HTTP 响应标头
    target, // 错误的目标
    details, // 错误详细信息
    innerError, // 包含更具体信息的系统内部错误对象
  } = options;

  ctx.body = {
    error: {
      code,
      message,
      target,
      details,
      innerError,
    },
  };

  ctx.status = status;
  ctx.set({
    'X-Ins-Trace-Id': rTracer.id(),
    ...headers,
  });
};

module.exports = {
  respSucc,
  respFail,
};
