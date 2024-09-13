require('dotenv').config();
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Profile = require('./models/Profile');
const Challenge = require('./models/Challenge');
const { getLogger, setupLogger } = require('./utils/logging');
const { giveCoins, giveXP } = require('./utils/main');
const { loadSettings, getSetting } = require('./utils/settingsCache');
const mongoUri = process.env.MONGO_URI;

async function startup () {
    if (!mongoUri) {
        console.log('MongoDB URI is missing. Please set the MONGO_URI environment variable.');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        await loadSettings();
        await setupLogger();

        const logger = await getLogger();

        await resetDailies();

        mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }    
}

async function resetDailies() {
    const logger = await getLogger();
    const profiles = await Profile.find({});
    const now = DateTime.now().setZone('America/New_York');

    for (const profile of profiles) {
        let changed = false;
        if (profile.userId != '102688836454203392') {
            continue;
        }
        for (const challenge of profile.challenges) {
            let challengeData = await Challenge.findOne({ _id: challenge.challengeId, daily: true });
            //logger.info(`\nChallenge Data: ${challengeData.name} | ${challengeData.daily} | ${challengeData.targetCount} | ${challengeData.xpReward} | ${challengeData.coinReward}\nPlayer: ${profile.userId} | ${challenge.progress} | ${challenge.completed} | ${challenge.lastCompleted}`);
            if (!challengeData) {
                continue;
            }

            if (challenge.completed) {
                await giveCoins(profile, challengeData.coinReward, `Challenge (${challengeData.name}) Completed`);
                await giveXP(profile, profile.guildId, challengeData.xpReward, false, `Challenge (${challengeData.name}) Completed`);
            }
            challenge.progress = 0;
            challenge.completed = false;
            challenge.lastCompleted = null;
            changed = true;
        }
        if (profile.luckyTokens < 5) {
            profile.luckyTokens = 5;
            changed = true;
        }

        // Add supply run coupons
        if (!profile.supplyRuns || profile.supplyRuns.length === 0) {
            profile.supplyRuns = [{
                startTime: now,
                endTime: now,
                couponType: null,
                state: 'Available'
            }, {
                startTime: now,
                endTime: now,
                couponType: null,
                state: 'Available'
            }, {
                startTime: now,
                endTime: now,
                couponType: null,
                state: 'Available'
            }];
            changed = true;
        }
        if (profile.supplyCouponT1 < 50) { profile.supplyCouponT1 += 5; changed = true; }

        // Add player stats if they are missing
        if (!profile.stats) {
            profile.stats = {
                speed: 0,
                acceleration: 0,
                handling: 0,
                luck: 0,
                fuelEfficiency: 0
            };
            changed = true;
        }

        if (changed) {
            await profile.save();
            
        }
    }
    logger.info(`Daily challenges and tokens reset for ${profiles.length} profiles.`);
}

startup().catch(console.error);