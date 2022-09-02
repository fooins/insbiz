# 保险业务系统（insbiz）

这是一个在福保成立初期设计开发的保险业务系统，它为前端销售渠道提供保险业务的接入，包括但不限于承保、退保、批改、查询保单、理赔、续保等服务。纯 API 接入没有界面。

- 整体[业务梳理](../../../.github/tree/main/profile/成立初期/成立初期业务梳理.md)和[系统设计](../../../.github/tree/main/profile/成立初期/成立初期系统设计.md)
- [数据库表结构](../../../.github/tree/main/profile/成立初期/sql)
- [REST API 参考文档](./REST-API-reference-latest.md)
- 压测记录和报告

## 目录结构

待更新...

## 使用说明

待更新...

## 环境变量

本项目根据 `NODE_ENV` 环境变量来识别当前所处的运行环境类型，用于指导某些程序作出相应的不同的动作，比如日志组件在不同环境下会记录不同级别的日志。启动服务时请务必设置正确的环境变量，特别是生产环境。目前支持以下值：

| 环境变量值  | 说明     |
| ----------- | -------- |
| production  | 生产环境 |
| development | 开发环境 |
