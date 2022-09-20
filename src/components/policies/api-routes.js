const Router = require('@koa/router');
const { accept, quote, get } = require('./services');
const { respSucc } = require('../../libraries/response');

// 实例化路由器
const router = new Router();

// 承保
router.post('/policies', async (ctx) => {
  const responseData = await accept.acceptInsurance(
    ctx.request.body,
    ctx.profile,
  );
  respSucc(ctx, responseData);
});

// 报价
router.post('/policies/quote', async (ctx) => {
  const responseData = await quote.quotation(ctx.request.body, ctx.profile);
  respSucc(ctx, responseData);
});

// 查询保单
router.get('/policies/:policyNo', async (ctx) => {
  const responseData = await get.getPolicy(ctx.params, ctx.profile);
  respSucc(ctx, responseData);
});

module.exports = router.routes();
