const Router = require('@koa/router');
const { accept, quote, get, renew, cancel } = require('./services');
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

// 续保
router.post('/policies/renew', async (ctx) => {
  const responseData = await renew.renewPolicy(ctx.request.body, ctx.profile);
  respSucc(ctx, responseData);
});

// 退保
router.delete('/policies/:policyNo', async (ctx) => {
  const responseData = await cancel.cancellation(ctx.params, ctx.profile);
  respSucc(ctx, responseData);
});

module.exports = router.routes();
