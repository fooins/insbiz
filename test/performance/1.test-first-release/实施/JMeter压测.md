# JMeter 压测

1. 下载基础配置文件 [insbiz-first-release.jmx](../JMeter/insbiz-first-release.jmx)。

2. 设置 JMeter 测试所需配置的 “线程数” 和 “循环次数”。

   - 可直接编辑配置文件中 `ThreadGroup` 节点下的 `ThreadGroup.num_threads` 和 `LoopController.loops` 值。
   - 或者通过 [JMeter 的 GUI 界面](../JMeter/JMeter的GUI界面.png) 打开并修改。

3. 将参数化数据放置在执行目录下的 `datas` 文件夹中。

4. 启动测试：`jmeter -n -e -f -t insbiz-first-release.jmx -l requests.jtl -j jmeter.log -o report`。

   - 每个请求都会生成一条记录保存在 `requests.jtl` 文件中（每次执行测试时会覆盖）。
   - JMeter 执行过程中的日志会记录在 `jmeter.log` 文件中（每次执行测试时会覆盖）。
   - 执行成功后会在 `report` 文件夹中生成 HTML 格式的报告（每次执行测试时会覆盖）。
   - Windows 系统需在 JMeter 的 bin 目录下执行。将配置文件和数据放置在目录下的 `insbiz` 文件夹中并执行：`./jmeter -n -e -f -t "./insbiz/insbiz-first-release.jmx" -l "./insbiz/requests.jtl" -j "./insbiz/jmeter.log" -o "./insbiz/report"`。
