const Router = require('@koa/router');
const { accept, quote } = require('./services');
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

module.exports = router.routes();
