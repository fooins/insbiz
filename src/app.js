const Koa = require("koa");
const router = require("./router");

// 实例化一个 Koa 应用
const app = new Koa();

// 设置路由
app.use(router.routes());

// 处理不允许的 HTTP 方法
app.use(router.allowedMethods());

module.exports = app;
