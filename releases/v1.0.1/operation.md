# Insbiz 1.0.1 发布操作

1. 准备代码

   - 克隆代码：`git clone https://github.com/fooins/insbiz.git insbiz-1.0.1 -b v1.0.1`。
   - 安装依赖：`npm install`。
   - 拷贝原有的配置：`./config/production.js`。

2. 停止旧服务

   - 查看服务在 pm2 中的 id：`pm2 list`。
   - 删除服务：`pm2 del {pm2id}`。

3. 启动新服务

   - 切换到新目录：`cd insbiz-1.0.1`。
   - 启动服务：`npm run start`。

4. 回滚（若需要）

   - 查看服务在 pm2 中的 id：`pm2 list`。
   - 删除服务：`pm2 del {pm2id}`。
   - 切换到旧目录：`cd insbiz-1.0.0`。
   - 启动旧服务：`npm run start`。
