const Joi = require('joi');

module.exports = {
  effectiveTime: Joi.date().iso(),
  expiryTime: Joi.date().iso().greater(Joi.ref('effectiveTime')),
  premium: Joi.number().positive().precision(2),
  applicants: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      idType: Joi.string().allow('idcard', 'passport'),
      idNo: Joi.string(),
      gender: Joi.string().allow('man', 'female', 'other', 'unknown'),
      birth: Joi.date().iso(),
      contactNo: Joi.string(),
      email: Joi.string().email(),
    }),
  ),
  insureds: Joi.array().items(
    Joi.object({
      relationship: Joi.string().allow(
        'self',
        'parents',
        'brothers',
        'sisters',
      ),
      name: Joi.string(),
      idType: Joi.string().allow('idcard', 'passport'),
      idNo: Joi.string(),
      gender: Joi.string().allow('man', 'female', 'other', 'unknown'),
      birth: Joi.date().iso(),
      contactNo: Joi.string(),
      email: Joi.string().email(),
      premium: Joi.number().positive().precision(2),
    }),
  ),
};
