const mongoose = require('mongoose');

const botSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const BotSetting = mongoose.model('BotSetting', botSettingSchema);

module.exports = BotSetting;