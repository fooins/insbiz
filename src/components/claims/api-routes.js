const Router = require('@koa/router');
const { apply, get } = require('./services');
const { respSucc } = require('../../libraries/response');

// 实例化路由器
const router = new Router();

// 申请理赔
router.post('/claims', async (ctx) => {
  const responseData = await apply.applyClaims(ctx.request.body, ctx.profile);
  respSucc(ctx, responseData);
});

// 查询理赔单
router.get('/claims/:claimNo', async (ctx) => {
  const responseData = await get.getClaim(ctx.params, ctx.profile);
  respSucc(ctx, responseData);
});

module.exports = router.routes();
