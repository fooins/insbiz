# Insbiz 1.0.0 发布操作

## 发布

1. 准备工作：安装 Node.js(16.x)、MySQL(8.x)、Redis(7.x) 和 Git。
2. 克隆代码：`git clone https://github.com/fooins/insbiz.git`。
3. 更新配置：修改 `./config/production.js` 文件以覆盖默认配置。
4. 安装依赖：`npm install`。
5. 初始化数据库：`NODE_ENV=production node ./releases/v1.0.0/init-db.js`。
6. 启动程序：`npm run start`。

## 回滚

无
