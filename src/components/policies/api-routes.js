const Router = require('@koa/router');

// 实例化路由器
const router = new Router();

// 承保
router.post('/policies', (ctx) => {
  ctx.status = 200;
  ctx.body = {
    policyNo: `P${Date.now()}`,
  };
});

module.exports = router.routes();
