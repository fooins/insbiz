const Router = require('@koa/router');
const { endorse } = require('./services');
const { respSucc } = require('../../libraries/response');

// 实例化路由器
const router = new Router();

// 批改
router.post('/endorsements', async (ctx) => {
  const responseData = await endorse.endorse(ctx.request.body, ctx.profile);
  respSucc(ctx, responseData);
});

module.exports = router.routes();
