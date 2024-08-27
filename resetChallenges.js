// resetChallenges.js
require('dotenv').config();
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Profile = require('./models/Profile');
const Challenge = require('./models/Challenge');
const { getLogger } = require('./utils/logging');
const { giveCoins, giveXP } = require('./utils/main');

const mongoUri = process.env.MONGO_URI;
//logger.info(`Mongo URI: ${mongoUri}`);
if (!mongoUri) {
    logger.error('resetChallenges: MongoDB URI is missing. Please set the MONGO_URI environment variable.');
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => logger.info('resetChallenges: Database connected...'))
    .catch(err => {
        logger.error('Database connection error:', err);
        process.exit(1);
});

async function resetDailyChallenges() {
    const profiles = await Profile.find({});
    const now = DateTime.now().setZone('America/New_York');

    for (const profile of profiles) {
        let changed = false;
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
        if (changed) {
            await profile.save();
            
        }
    }
    logger.info(`Daily challenges reset for ${profiles.length} profiles.`);
    mongoose.disconnect();
}

resetDailyChallenges().catch(logger.error);