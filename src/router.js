const Router = require('@koa/router');

// 实例化路由器
const router = new Router({ prefix: '/v1.0' });

// 导入路由
const policyRoutes = require('./components/policies/api-routes');
const endorseRoutes = require('./components/endorsements/api-routes');
const claimRoutes = require('./components/claims/api-routes');

// 嵌套路由
router.use(policyRoutes);
router.use(endorseRoutes);
router.use(claimRoutes);

module.exports = router;
