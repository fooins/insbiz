// 统一的、缺省的扩展字段配置
// 以数据表为维度

const applicant = require('./applicant');
const claimInsured = require('./claim-insured');
const claim = require('./claim');
const endorsement = require('./endorsement');
const insured = require('./insured');
const policy = require('./policy');

module.exports = {
  applicant,
  claimInsured,
  claim,
  endorsement,
  insured,
  policy,
};
