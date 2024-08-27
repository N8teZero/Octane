const { bold } = require('discord.js');
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const { getLogger } = require('../utils/logging');

const upgradeSchema = new mongoose.Schema({
    type: String,
    level: { type: Number, default: 1 },
    stats: {
        speed: { type: Number, default: 0.0 },
        acceleration: { type: Number, default: 0.0 },
        handling: { type: Number, default: 0.0 }
    }
});

const vehicleSchema = new mongoose.Schema({
    year: {type: Number },
    make: { type: String },
    model: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: false },
    isStarterCar: { type: Boolean, default: false },
    upgrades: [upgradeSchema],
    stats: {
        speed: { type: Number, default: 0 },
        acceleration: { type: Number, default: 0 },
        handling: { type: Number, default: 0 },
        fuelCapacity: { type: Number, default: 0 },
        currentFuel: { type: Number, default: 100 }
    }
});

const challengeProgressSchema = new mongoose.Schema({
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastCompleted: { type: Date }
});

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    username: { type: String, required: true },
    joinDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    lastMessageDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    settings: {
        profileImage: { type: String }, // Base64 encoded image
        profileImageLastUpdate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
        profileLastUpdate: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
        backgroundColor: { type: String, default: '#00ff00' },
        borderColor: { type: String, default: '#000000' },
        xpColor: { type: String, default: '#99ECBE' },
        customImage: { type: String, default: 'https://i.imgur.com/tCZPGbE.png' }
    },
    coins: { type: Number, default: 500 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastCachedXp: { type: Number, default: 0 },
    lastAFKClaim: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    lastXpTime: { type: Date, default: () => DateTime.now().setZone('America/New_York').minus({ days: 1 }).toJSDate() },
    lastDaily: { type: Date, default: () => DateTime.now().setZone('America/New_York').minus({ days: 1 }).toJSDate() },
    lastWeekly: { type: Date, default: () => DateTime.now().setZone('America/New_York').minus({ weeks: 1 }).toJSDate() },
    lastWorkTime: { type: Date, default: () => DateTime.now().setZone('America/New_York').minus({ minutes: 20 }).toJSDate() },
    lastLotteryPlay: { type: Date, default: () => DateTime.now().setZone('America/New_York').minus({ days: 1 }).toJSDate() },
    lastRefuel: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    lastCrewDonation: { type: Date, default: () => DateTime.now().setZone('America/New_York').toJSDate() },
    crew: { type: String, default: null },
    crewTokens: { type: Number, default: 0 },
    dailyCount: { type: Number, default: 0 },
    weeklyCount: { type: Number, default: 0 },
    workCount: { type: Number, default: 0 },
    lotteryCount: { type: Number, default: 0 },
    luckyTokens: { type: Number, default: 5 },
    prestigeLevel: { type: Number, default: 0 },
    prestigeTokens: { type: Number, default: 0 },
    job: { type: String, default: null },
    junkyardPasses: { type: Number, default: 0 },
    junkyardVisits: { type: Number, default: 0 },
    lastJunkyardVisit: { type: Date },
    inventory: [{
        partName: { type: String },
        condition: { type: String }, // 'Worn', 'Broken', 'Damaged', 'Usable'
        value: { type: Number, default: 0 }
    }],
    booster: {
        xp: { type: Number, default: 1.0 },
        xpExpires: { type: Date },
        coins: { type: Number, default: 1.0 },
        coinsExpires: { type: Date }
    },
    streetRaceCount: { type: Number, default: 0 },
    streetRaceStats: {
        highestLevelUnlocked: { type: Number, default: 1 },
        lastRaceDate: { type: Date, default: () => DateTime.now().setZone('America/New_York').minus({ days: 1 }).toJSDate() },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }
    },
    vehicles: [vehicleSchema],
    challenges: [challengeProgressSchema]
});


profileSchema.statics.initializeProfile = async function(userId, guildId, username) {
    let profile = await this.findOne({ userId, guildId });
    if (!profile) {
        profile = new this({ userId, guildId, username });
        try {
            await profile.save();
        } catch (error) {
            logger.error(userId+' | initializeProfile: '+error);
            throw error;
        }
    }
    return profile;
};

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;