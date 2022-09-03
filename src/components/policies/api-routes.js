const Router = require('@koa/router');
const { respSucc } = require('../../libraries/response');

// 实例化路由器
const router = new Router();

// 承保
router.post('/policies', (ctx) => {
  respSucc(ctx, {
    policyNo: `P${Date.now()}`,
  });
});

module.exports = router.routes();
