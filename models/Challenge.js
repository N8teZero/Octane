const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const challengeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    xpReward: { type: Number, required: true },
    coinReward: { type: Number, required: true },
    targetType: { type: String, required: true },
    targetCount: { type: Number, required: true },
    daily: { type: Boolean, default: false },
    category: { type: String, required: true },
    creatorId: { type: String, required: true },
    createDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() }
});

const Challenge = mongoose.model('Challenge', challengeSchema);
module.exports = Challenge;