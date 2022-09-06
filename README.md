# 保险业务系统（insbiz）

这是一个在福保成立初期设计开发的保险业务系统，它为前端销售渠道提供保险业务的接入，包括但不限于承保、退保、批改、查询保单、理赔、续保等服务。纯 API 接入没有界面。

- 整体[业务梳理](../../../.github/tree/main/profile/成立初期/成立初期业务梳理.md)和[系统设计](../../../.github/tree/main/profile/成立初期/成立初期系统设计.md)
- [数据库表结构](../../../.github/tree/main/profile/成立初期/sql)
- [REST API 参考文档](./REST-API-reference-latest.md)
- 压测记录和报告

## 目录结构

```
├─ config  // 配置文件目录
│  ├─ default.js  // 默认配置文件
│  ├─ development.js  // 开发环境配置文件
│  └─ production.js  // 生产环境配置文件
│
├─ src  // 源代码目录
│  ├─ components  // 业务组件目录
│  │  └─ xxx  // 某个业务组件目录
│  │     ├─ api-routes.js  // HTTP 接口路由
│  │     ├─ dao.js  // 数据访问对象
│  │     └─ service.js  // 业务逻辑实现
│  │
│  ├─ libraries  // 工具包目录
│  │  ├─ error-handling.js  // 错误处理工具
│  │  ├─ logger.js  // 日志工具
│  │  └─ ...  // 更多工具
│  │
│  ├─ models  // 数据库表模型目录
│  │
│  ├─ app.js  // 程序主应用实现
│  ├─ router.js  // HTTP 路由实现
│  ├─ server.js  // HTTP 服务实现
│  └─ start.js  // 程序启动入口
│
└─ REST-API-reference-latest.md  // REST API 参考文档
```

## 使用说明

1. 克隆代码 `git clone https://github.com/fooins/insbiz.git`

2. 安装依赖 `npm install`

3. 启动程序 `npm run start:dev`

## 环境变量

本项目根据 `NODE_ENV` 环境变量来识别当前所处的运行环境类型，用于指导某些程序作出相应的不同的动作，比如日志组件在不同环境下会记录不同级别的日志。启动服务时请务必设置正确的环境变量，特别是生产环境。目前支持以下值：

| 环境变量值  | 说明     |
| ----------- | -------- |
| production  | 生产环境 |
| development | 开发环境 |
