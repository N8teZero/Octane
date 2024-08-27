const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const challengeSchema = new mongoose.Schema({
    name: String,
    description: String,
    xpReward: Number,
    coinReward: Number,
    targetType: String, // e.g., "racesCompleted", "profileChecks"
    targetCount: Number,
    daily: Boolean, // true if the challenge resets daily
    creatorId: String,
    createDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() }
});

module.exports = mongoose.model('Challenge', challengeSchema);