const Joi = require('joi');

module.exports = {
  effectiveTime: Joi.date().iso(),
  expiryTime: Joi.date().iso().greater(Joi.ref('effectiveTime')),
  premium: Joi.number().positive().precision(2),
  applicants: {
    name: Joi.string(),
    idType: Joi.string().allow('idcard', 'passport'),
    idNo: Joi.string(),
    gender: Joi.string().allow('man', 'female', 'other', 'unknown'),
    birth: Joi.date().iso(),
    contactNo: Joi.string(),
    email: Joi.string().email(),
  },
  insureds: {
    relationship: Joi.string().allow('self', 'parents', 'brothers', 'sisters'),
    name: Joi.string(),
    idType: Joi.string().allow('idcard', 'passport'),
    idNo: Joi.string(),
    gender: Joi.string().allow('man', 'female', 'other', 'unknown'),
    birth: Joi.date().iso(),
    contactNo: Joi.string(),
    email: Joi.string().email(),
    premium: Joi.number().positive().precision(2),
  },
};
