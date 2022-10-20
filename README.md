# 保险业务系统（insbiz）

这是一个在福保成立初期设计开发的保险业务系统，它为前端销售渠道提供保险业务的接入，包括但不限于承保、退保、批改、查询保单、理赔、续保等服务。纯 API 接入没有界面。

- 整体[业务梳理](../../../.github/tree/main/profile/成立初期/成立初期业务梳理.md)和[系统设计](../../../.github/tree/main/profile/成立初期/成立初期系统设计.md)
- [数据库表结构](../../../.github/tree/main/profile/成立初期/sql)
- [REST API 参考文档](./REST-API-reference-latest.md)
- 压测记录和报告

## 目录结构

```
├─ config  // 配置文件目录
├─ releases  // 发布信息目录
│
├─ src  // 源代码目录
│  ├─ components  // 业务组件目录
│  ├─ jobs  // 作业（定时任务）目录
│  ├─ libraries  // 工具包目录
│  ├─ models  // 数据库表模型目录
│  ├─ scripts  // NPM 脚本目录
│  │
│  ├─ app.js  // 程序主应用实现
│  ├─ router.js  // HTTP 路由实现
│  ├─ scheduler.js  // 作业调度器
│  ├─ server.js  // HTTP 服务实现
│  └─ start.js  // 程序启动入口
│
└─ REST-API-reference-latest.md  // REST API 参考文档
```

## 使用说明

1. 准备工作：安装 Node.js、MySQL、Redis 和 Git。
2. 克隆代码：`git clone https://github.com/fooins/insbiz.git`。
3. 更新配置：修改 `./config/development.js` 文件以覆盖默认配置。
4. 安装依赖：`npm install`。
5. 同步模型：`npm run sync-models:dev`。
6. 启动程序：`npm run start:dev`。

## 环境变量

本项目根据 `NODE_ENV` 环境变量来识别当前所处的运行环境类型，用于指导某些程序作出相应的不同的动作，比如日志组件在不同环境下会记录不同级别的日志。启动服务时请务必设置正确的环境变量，特别是生产环境。目前支持以下值：

| 环境变量值  | 说明     |
| ----------- | -------- |
| production  | 生产环境 |
| development | 开发环境 |

## 脚本命令

- `start:dev`：启动开发环境程序服务。主要用于本地开发调试，代码变更后会自动重启。
- `lint`：对 src 目录下的文件执行 ESLint 检查并修复可自动修复的错误或警告。
- `sync-models:dev`：将所有模型同步到开发环境数据库，已经存在的表会自动根据模型调整为最新的结构。
- `reset-data:dev`：在开发环境数据库中添加样本数据，在此之前会先清空数据并同步所有模型。
