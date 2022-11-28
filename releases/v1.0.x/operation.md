# Insbiz 1.0.0 发布操作

1. 购买设备（这里用的是腾讯云）

   - 购买云服务器。
   - 购买 MySQL(8.x) 实例。

2. 准备环境

   - 安装 Node.js(16.x)、Redis(7.x) 和 Git。
   - 安装 PM2：`npm install pm2 --global`。

3. 部署程序

   - 克隆代码：`git clone https://github.com/fooins/insbiz.git insbiz-1.0.0 -b v1.0.0`。
   - 安装依赖：`npm install`。
   - 更新配置：修改 `./config/production.js` 文件以覆盖默认配置。
   - 启动程序：`npm run start`。

4. 数据操作

   - 创建数据库：`NODE_ENV=production node ./releases/v1.0.0/create-db.js`。
   - 创建表：`NODE_ENV=production node ./releases/v1.0.0/create-tables.js`。
   - 初始化数据：`NODE_ENV=production node ./releases/v1.0.0/init-datas.js`。

5. 回滚（若需要）

   - 查看程序在 pm2 中的 id：`pm2 list`。
   - 删除服务：`pm2 del {pm2id}`。
