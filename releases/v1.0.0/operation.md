# Insbiz 1.0.0 发布操作

## 发布

1. 准备工作：安装 Node.js(16.x)、MySQL(8.x) 和 Redis(7.x)。
2. 下载代码：`wget https://github.com/fooins/insbiz/archive/refs/tags/v1.0.0.tar.gz`。
3. 解压代码：`tar zxvf v1.0.0.tar.gz`;
4. 安装依赖：`npm install`。
5. 安装 PM2：`npm install pm2 --global`。
6. 更新配置：修改 `./config/production.js` 文件以覆盖默认配置。
7. 初始化数据库：`NODE_ENV=production node ./releases/v1.0.0/init-db.js`。
8. 启动程序：`npm run start`。

## 回滚

无
