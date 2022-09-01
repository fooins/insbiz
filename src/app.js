const Koa = require('koa');
const rTracer = require('cls-rtracer');
const router = require('./router');

// 实例化一个 Koa 应用
const app = new Koa();

// 生成跟踪标识
app.use(rTracer.koaMiddleware());

// 设置路由
app.use(router.routes());

// 处理不允许的 HTTP 方法
app.use(router.allowedMethods());

module.exports = app;
