module.exports = {
  // 检测测试文件的 glob 模式。
  testMatch: ['**/test/api/**/*.js'],
  // 指出是否收集测试时的覆盖率信息。
  collectCoverage: true,
  // 指示应使用哪个提供程序来检测代码覆盖率。
  coverageProvider: 'v8',
};
