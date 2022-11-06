module.exports = {
  // 检测测试文件的 glob 模式。
  testMatch: ['**/test/api/**/*.js'],
  // 指示是否应在运行期间报告每个单独的测试
  verbose: true,
  // 指出是否收集测试时的覆盖率信息。
  collectCoverage: false,
  // 指示应使用哪个提供程序来检测代码覆盖率。
  coverageProvider: 'v8',
};
