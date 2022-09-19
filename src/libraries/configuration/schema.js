const Joi = require('joi');

module.exports = Joi.object({
  db: Joi.object()
    .keys({
      host: Joi.string().hostname().required(),
      port: Joi.number().port().required(),
      username: Joi.string().required(),
      password: Joi.string().required(),
      database: Joi.string().required(),
    })
    .required(),
  crypto: Joi.object()
    .keys({
      aesKey: Joi.string().length(32).required(),
    })
    .required(),
  redis: Joi.object()
    .keys({
      host: Joi.string().hostname().required(),
      port: Joi.number().port().required(),
      password: Joi.string().required(),
      db: Joi.number().min(0).required(),
    })
    .required(),
});
