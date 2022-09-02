module.exports = class Env {
  /**
   * 程序当前是否运行在生产环境下
   * @returns {boolean} true|false
   */
  static isProd() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * 程序当前是否运行在开发环境下
   * @returns {boolean} true|false
   */
  static isDev() {
    return process.env.NODE_ENV === 'development';
  }
};
