const Joi = require('joi');

module.exports = Joi.object({
  db: Joi.object()
    .keys({
      host: Joi.string().required(),
      port: Joi.number().required(),
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
});
