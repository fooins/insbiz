const Router = require('@koa/router');
const service = require('./service');
const { respSucc } = require('../../libraries/response');

// 实例化路由器
const router = new Router();

// 承保
router.post('/policies', async (ctx) => {
  const responseData = await service.acceptInsurance(
    ctx.request.body,
    ctx.profile,
  );
  respSucc(ctx, responseData);
});

module.exports = router.routes();
