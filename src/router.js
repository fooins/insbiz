const Router = require("@koa/router");
const router = new Router({ prefix: "/v1.0" });
const { policyController } = require("./components/policies");

// 保单接口
router.post("/policies", policyController.bound); // 承保

module.exports = router;
