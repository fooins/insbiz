# Insbiz 1.0.0 发布操作

## 发布

1. 准备环境

   - 安装 Node.js(16.x)、MySQL(8.x) 和 Redis(7.x)。
   - 安装 PM2：`npm install pm2 --global`。

2. 部署代码

   - 下载代码：`wget https://github.com/fooins/insbiz/archive/refs/tags/v1.0.0.tar.gz`。
   - 解压代码：`tar zxvf v1.0.0.tar.gz`;
   - 安装依赖：`npm install`。
   - 更新配置：修改 `./config/production.js` 文件以覆盖默认配置。
   - 启动程序：`npm run start`。

3. 数据操作

   - 初始化数据库：`NODE_ENV=production node ./releases/v1.0.0/init-db.js`。

## 回滚

无
