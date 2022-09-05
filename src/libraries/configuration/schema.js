const Joi = require('joi');

module.exports = Joi.object({
  db: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().required(),
    user: Joi.string().required(),
    password: Joi.string().required(),
  }),
});
