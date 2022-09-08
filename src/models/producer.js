const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../libraries/data-access');

module.exports = function getProducerModel() {
  return getDbConnection().define(
    'Producer',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '自增ID',
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '渠道名称',
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: '渠道编码',
      },
    },
    {
      comment: '销售渠道表',
    },
  );
};
