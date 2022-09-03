const Koa = require('koa');
const rTracer = require('cls-rtracer');
const router = require('./router');
const accessLog = require('./libraries/access-log');
const { handleRouteErrors } = require('./libraries/error-handling');

// 实例化一个 Koa 应用
const app = new Koa();

// 处理错误（没有追踪标识）
app.use(handleRouteErrors);

// 生成追踪标识
app.use(rTracer.koaMiddleware());

// 处理错误（有追踪标识）
app.use(handleRouteErrors);

// 记录访问日志
app.use(accessLog);

// 设置路由
app.use(router.routes());

// 处理不允许的 HTTP 方法
app.use(router.allowedMethods());

module.exports = app;
