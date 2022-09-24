const Router = require('@koa/router');
const { claim } = require('./services');
const { respSucc } = require('../../libraries/response');

// 实例化路由器
const router = new Router();

// 申请理赔
router.post('/claims', async (ctx) => {
  const responseData = await claim.claim(ctx.request.body, ctx.profile);
  respSucc(ctx, responseData);
});

module.exports = router.routes();
