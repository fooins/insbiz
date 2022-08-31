const Router = require('@koa/router');
const { policyController } = require('./components/policies');

// 实例化路由器
const router = new Router({ prefix: '/v1.0' });

// 保单接口
router.post('/policies', policyController.bound); // 承保

module.exports = router;
