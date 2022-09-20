const Koa = require('koa');
const koaBody = require('koa-body');
const rTracer = require('cls-rtracer');
const router = require('./router');
const accessLog = require('./libraries/access-log');
const authenticator = require('./libraries/authenticator');
const {
  handleRouteErrors,
  AppError,
  ErrorCodes,
} = require('./libraries/error-handling');

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

// 解析请求体
app.use(
  koaBody({
    // 是否返回原始的请求体，默认为 false
    includeUnparsed: true,
    // JSON 体的大小限制，默认为 1mb
    jsonLimit: '10mb',
    // 自定义错误处理
    onError: (error) => {
      // 请求内容过大
      if (error.type === 'entity.too.large') {
        throw new AppError('请求的大小超出最大限制。', {
          HTTPStatus: 413,
          code: 'InvalidRequest',
          cause: error,
        });
      } else {
        throw new AppError(error.message, {
          HTTPStatus: error.status || 500,
          code:
            error.status && `${error.status}`.substring(0, 1) === '4'
              ? 'InvalidRequest'
              : 'GeneralException',
          cause: error,
        });
      }
    },
  }),
);

// 鉴权
app.use(authenticator);

// 设置路由
app.use(router.routes());

// 处理不允许的 HTTP 方法
app.use(
  router.allowedMethods({
    throw: true,
    methodNotAllowed: () =>
      new AppError('Method Not Allowed', {
        code: ErrorCodes.InvalidRequest,
        HTTPStatus: 405,
      }),
  }),
);

module.exports = app;
