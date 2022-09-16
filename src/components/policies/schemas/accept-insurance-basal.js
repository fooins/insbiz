const Joi = require('joi');

module.exports = {
  orderNo: Joi.string()
    .max(64)
    .pattern(/^[a-zA-Z0-9_]*$/)
    .required(),
  contractCode: Joi.string().required(),
  contractVersion: Joi.string(),
  planCode: Joi.string().required(),
};
