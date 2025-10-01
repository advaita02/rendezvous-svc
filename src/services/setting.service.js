const Setting = require('../models/setting.model');

const getSettingValue = async (key, defaultValue = null) => {
  const setting = await Setting.findOne({ key });
  return setting ? setting.value : defaultValue;
};

module.exports = {
    getSettingValue,
}