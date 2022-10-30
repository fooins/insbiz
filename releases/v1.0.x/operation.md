# Insbiz 1.0.x 发布操作

## 全新部署

1. 准备环境

   - 安装 Node.js(16.x)、MySQL(8.x)、Redis(7.x) 和 Git。
   - 安装 PM2：`npm install pm2 --global`。

2. 部署代码

   - 克隆代码：`git clone https://github.com/fooins/insbiz.git insbiz-1.0.x -b v1.0.0`。
   - 安装依赖：`npm install`。
   - 更新配置：修改 `./config/production.js` 文件以覆盖默认配置。
   - 启动程序：`npm run start`。

3. 数据操作

   - 创建数据库：`NODE_ENV=production node ./releases/v1.0.0/create-db.js`。
   - 创建表：`NODE_ENV=production node ./releases/v1.0.0/create-tables.js`。
   - 初始化数据：`NODE_ENV=production node ./releases/v1.0.0/init-datas.js`。

4. 回滚发布：关闭服务即可。

## 更新补丁

1. 切换分支：`git checkout {分支名}`。
2. 更新代码：`git pull`。
3. 回滚代码：`git reset {指定版本}`
