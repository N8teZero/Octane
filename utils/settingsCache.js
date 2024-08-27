const BotSetting = require('../models/Settings');

const settingsCache = {};

async function loadSettings() {
    const settings = await BotSetting.find({});
    settings.forEach(setting => {
        settingsCache[setting.key] = setting.value;
    });
    //console.log('Settings loaded into cache:', settingsCache);
}

async function getSetting(key) {
    return settingsCache[key];
}

module.exports = { loadSettings, getSetting };
