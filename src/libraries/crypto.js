const CryptoJS = require('crypto-js');
const config = require('config');

/**
 * AES 加密
 * @param {string} message 明文
 * @returns {string} 密文
 */
const aesEncrypt = (message) => {
  const aesKey = config.get('crypto.aesKey');
  return CryptoJS.AES.encrypt(message, aesKey).toString();
};

/**
 * AES 解密
 * @param {string} ciphertext 密文
 * @returns {string} 明文
 */
const aesDecrypt = (ciphertext) => {
  const aesKey = config.get('crypto.aesKey');
  const bytes = CryptoJS.AES.decrypt(ciphertext, aesKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = {
  aesEncrypt,
  aesDecrypt,
};
