const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    allowedChannels: { type: [String], default: [] },
    levelupMessages: { type: Boolean, default: false },
    levelupChannel: { type: String, default: '' },
    lastUpdate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() }
});

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);