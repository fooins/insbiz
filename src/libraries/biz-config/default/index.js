// 统一的、缺省的业务规则配置
// 应从业务角度进行定义，不依赖于具体的技术

const accept = require('./accept');
const renew = require('./renew');
const endorse = require('./endorse');
const cancel = require('./cancel');
const claim = require('./claim');

module.exports = {
  // 承保相关
  accept,
  // 续保相关
  renew,
  // 批改相关
  endorse,
  // 退保相关
  cancel,
  // 理赔相关
  claim,
};
