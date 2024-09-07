// Description: Utility functions for xp, coins, and fuel related operations.
const Profile = require('../models/Profile');
const { DateTime } = require('luxon');
const GuildSettings = require('../models/GuildSettings');
const Job = require('../models/Jobs');
const { getLogger } = require('./logging');
const Item = require('../models/Items');

// Main functions

async function calculateLevel(xp) {
    let logger = await getLogger();
    let level = 0;
    let totalXp = 0;
    let xpForNextLevel = 1200; // Initial XP needed for the first level
    let levelOffset = 50;
    let levelMultiplier = 10;
    let maxLevel = 20;

    if (xp < 0) {
        logger.warn(`Invalid XP value: ${xp}`);
        xp = 0;
    }

    if (xp === 0) {
        return {
            level: 0,
            currentLevelXp: 0,
            remainingXp: 1200,
            nextLevelXp: 1200,
            progress: 0
        };
    }

    while (totalXp <= xp && level < maxLevel) {
        level++;
        totalXp += xpForNextLevel;
        if (totalXp > xp) {
            break;
        }
        xpForNextLevel += Math.floor((levelOffset + level) * levelMultiplier);
    }

    if (level >= maxLevel) {
        xpForNextLevel = 0;
    }

    let currentLevelXp = totalXp - xpForNextLevel;
    let nextLevelXp = totalXp;
    let progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    let remainingXp = nextLevelXp - xp;

    return {
        level,
        currentLevelXp,
        remainingXp,
        nextLevelXp,
        progress,
    };
}

async function giveXP(profile, guild, xp, client, source) {
    let logger = await getLogger();
    const now = DateTime.now().setZone('America/New_York');
    const preLevel = profile.level;

    const xpBooster = profile.booster.xp || 1.0;
    xp = Math.floor(xp * xpBooster);

    profile.xp += xp;
    profile.lastXpTime = now.toJSDate();

    const postLevelInfo = await calculateLevel(profile.xp);
    const postLevel = postLevelInfo.level;

    profile.level = postLevel;
    await profile.save();
    logger.debug(`${profile.username} earned ${xp} XP with ${xpBooster}x booster from ${source}`);
    //log.info(`Level: ${preLevel} => ${postLevel}`);
    if (postLevel > preLevel) {
        logger.debug(`${profile.username} leveled up to ${postLevel}!!`);
        const settings = await GuildSettings.findOne({ guildId: guild });
        if (settings.levelupMessages && settings.levelupChannel !== '0' && settings.levelupChannel && client) {
            try {
                const channel = client.channels.cache.get(settings.levelupChannel);
                if (channel) {
                    await channel.send(`:tada: ${profile.username} leveled up to ${postLevel}!!`);
                } else {
                    logger.warn('Channel not found in guild');
                }
            } catch (error) {
                logger.error(profile.userId+' | giveXP: '+error);
            }
        }        
        return true;
    };
}

async function giveCoins(profile, coins, source) {
    let logger = await getLogger();
    const coinsBooster = profile.booster.coins || 1.0;
    coins = Math.floor(coins * coinsBooster);
    profile.coins += coins;
    await profile.save();

    logger.debug(`${profile.username} earned ${coins} coins with ${coinsBooster}x booster from ${source}`);
}

async function giveItem(profile, item, quantity, source) {
    let logger = await getLogger();
    const itemData = await Item.findOne({ itemId: item });
    if (!itemData) return;

    if (itemData.itemId === 'junkyard_pass') {
        profile.junkyardPasses += quantity;
    } else if (itemData.itemId === 'lottery_ticket') {
        profile.luckyTokens += quantity;
    } else if (itemData.itemId === 'booster_xp') {
        profile.booster.xp = 2.0;
        profile.booster.xpExpires = DateTime.now().plus({ hours: 1 }).toJSDate();
    } else if (itemData.itemId === 'booster_coins') {
        profile.booster.coins = 2.0;
        profile.booster.coinsExpires = DateTime.now().plus({ hours: 1 }).toJSDate();
    } else {
        return false;
    }

    logger.debug(`${profile.username} earned ${quantity} ${itemData.name} from ${source}`);
    await profile.save();
}

const passiveRefuel = async (profile) => {
    let logger = await getLogger();
    const playerVehicle = profile.vehicles.find(v => v.isActive);
    logger.debug(`Passive refuel for ${profile.username} | Vehicle: ${playerVehicle.make} ${playerVehicle.model}`);
    if (playerVehicle.stats.currentFuel >= playerVehicle.stats.fuelCapacity) return profile;

    const prof = await Profile.findOne({ userId: profile.userId, guildId: profile.guildId });
    const lastRaceDate = prof.streetRaceStats.lastRaceDate ? DateTime.fromJSDate(prof.streetRaceStats.lastRaceDate) : null;
    const now = DateTime.now().setZone('America/New_York');
    const passiveStart = lastRaceDate ? lastRaceDate.plus({ minutes: 60 }).startOf('minute') : now; //   ||  .plus({ days: 1 }).startOf('day')
    
    if (now >= passiveStart) {
        try {
            const minutesPassed = now.diff(passiveStart, 'minutes').minutes;
            const fuelToAdd = Math.floor(minutesPassed / 10); // 10 minutes per fuel
            playerVehicle.stats.currentFuel += fuelToAdd;
            if (playerVehicle.stats.currentFuel > playerVehicle.stats.fuelCapacity) playerVehicle.stats.currentFuel = playerVehicle.stats.fuelCapacity;
            await prof.save();
        } catch (err) {
            logger.error(profile.userId+' | passiveRefuel: '+err);
        }
    }
    return prof;
};




// Reward functions
const rewardsTable = async (profile) => {
    let logger = await getLogger();
    try {
        const levelInfo = await calculateLevel(profile.xp);
        await updateBooster(profile);
        const prof = await Profile.findOne({ userId: profile.userId, guildId: profile.guildId });

        const minXp = levelInfo.level * 2;
        const maxXp = levelInfo.level * 10;
        const xpBooster = prof.booster.xp || 1.0;
        const chatXP = Math.floor(Math.random() * (maxXp - minXp + 1) + minXp) * xpBooster;
        const workXP = Math.floor(Math.random() * (125 - 75 + 1) + 75) * xpBooster;
        const dailyCoins = levelInfo.level * 100;
        const weeklyCoins = levelInfo.level * 500;
        //logger.debug(`chatXP: ${chatXP}, workXP: ${workXP}, dailyCoins: ${dailyCoins}, weeklyCoins: ${weeklyCoins}`);
        if (isNaN(dailyCoins)) {
            logger.warn('Daily coins calculation resulted in NaN');
            throw new Error('Invalid daily coins calculation');
        }
        return { chatXP, workXP, dailyCoins, weeklyCoins };
    } catch (err) {
        logger.error(profile.userId+' | rewardsTable: '+err);
        throw err;
    }   
}

const calculatePassiveIncome = async (profile) => {
    let logger = await getLogger();
    await updateBooster(profile);
    profile = await Profile.findOne({ userId: profile.userId });
    const xpBooster = profile.booster.xp || 1.0;
    const moneyBooster = profile.booster.coins || 1.0;
    const now = DateTime.now().setZone('America/New_York');
    const jobData = await Job.findById(profile.job);
    const employee = jobData ? jobData.employees.find(e => e.userID === profile.userId) : null;
    const jobPay = employee ? employee.coinsPerMin : 0;

    const xpIncome = (profile.level * 2) * xpBooster;
    const moneyIncome = ((profile.level * 100) + jobPay) * moneyBooster;
    //logger.debug(`Passive income for [L${profile.level}] ${profile.username}: ${xpIncome} XP/hr, ${moneyIncome} coins/hr`);
    return { xpIncome, moneyIncome };
}

// Update boosters
const updateBooster = async (profile) => {
    let logger = await getLogger();
    const booster = profile.booster;
    const now = DateTime.now().setZone('America/New_York');

    try {
        if (booster.xp && DateTime.fromJSDate(booster.xpExpires) < now) {
            booster.xp = 1.0;
            booster.xpExpires = null;
        }

        if (booster.coins && DateTime.fromJSDate(booster.coinsExpires) < now) {
            booster.coins = 1.0;
            booster.coinsExpires = null;        
        }
        await profile.save();
    } catch (err) {
        logger.error(profile.userId+' | updateBooster: '+err);
    }
};

const resetStreetRaceTickets = async (profile) => {
    let logger = await getLogger();
    const prof = await Profile.findOne({ userId: profile.userId, guildId: profile.guildId });

    const lastRaceDate = prof.streetRaceStats.lastRaceDate ? DateTime.fromJSDate(prof.streetRaceStats.lastRaceDate) : null;
    const now = DateTime.now().setZone('America/New_York');
    const nextRaceDate = lastRaceDate ? lastRaceDate.plus({ minutes: 20 }).startOf('minute') : now; //   ||  .plus({ days: 1 }).startOf('day')
    
    if (now >= nextRaceDate) {
        try {
            prof.streetRaceStats.streetRaceTickets = 3;
            prof.streetRaceStats.lastRaceDate = now.toJSDate();
            await prof.save();
        } catch (err) {
            logger.error(profile.userId+' | resetStreetRaceTickets: '+err);
        }
    }
    return prof;
};

const resetLuckyTokens = async (profile) => {
    let logger = await getLogger();
    const prof = await Profile.findOne({ userId: profile.userId });

    const lastLotteryPlay = prof.lastLotteryPlay ? DateTime.fromJSDate(prof.lastLotteryPlay) : null;
    const now = DateTime.now().setZone('America/New_York');
    const nextLotteryPlay = lastLotteryPlay ? lastLotteryPlay.plus({ days: 1 }).startOf('day') : now;

    if (now >= nextLotteryPlay) {
        try {
            prof.luckyTokens = 5;
            prof.lastLotteryPlay = now.toJSDate();
            await prof.save();
        } catch (err) {
            logger.error(profile.userId+' | resetLuckyTokens: '+err);
        }
    }
    return prof;
}

const calculatePlayerScore = async (profile) => {
    const playerVehicle = profile.vehicles.find(v => v.isActive);
    let playerScore = Math.floor((playerVehicle.stats.speed * 0.2) + (playerVehicle.stats.acceleration * 0.15) + (playerVehicle.stats.handling * 0.1));
    playerScore = playerScore < 1 ? 1 : playerScore;
    playerScore = Math.floor(playerScore * (profile.level * 0.1));

    return playerScore;
}

// Challenges
const Challenge = require('../models/Challenge');

async function updateChallenge(user, type) {
    let logger = await getLogger();
    const now = DateTime.now().setZone('America/New_York');
    const profile = await Profile.findOne({ userId: user.userId });

    if (!profile) {
        logger.error(user.id + ' | updateChallenges: Profile not found');
        return;
    }

    // Fetch all challenges that match the targetType and are appropriate for the category.
    const challenges = await Challenge.find({ targetType: type });

    if (!challenges.length) return;

    try {
        // Loop through each challenge and update accordingly
        challenges.forEach(async (challengeData) => {
            const challengeProgress = profile.challenges.find(ch => ch.challengeId.equals(challengeData._id));

            if (!challengeProgress) {
                if (challengeData.targetCount === 1) {
                    profile.challenges.push({
                        challengeId: challengeData._id,
                        progress: 1,
                        completed: true,
                        lastCompleted: now.toJSDate()
                    });
                } else {
                    profile.challenges.push({
                        challengeId: challengeData._id,
                        progress: 1
                    });
                }
            } else if (challengeProgress && challengeProgress.completed) {
                return;
            } else {
                challengeProgress.progress++;
                if (challengeProgress.progress >= challengeData.targetCount) {
                    challengeProgress.completed = true;
                    challengeProgress.lastCompleted = now.toJSDate();
                }
            }
        });

        await profile.save();
    } catch (err) {
        logger.error(user.id + ' | updateChallenges: ' + err);
    }
}


// Vehicle upgrades
const calculateStatBonuses = async (vehicle) => {

    if (!vehicle.upgrades || vehicle.upgrades.length === 0) return { speedBonus: 0, accelerationBonus: 0, handlingBonus: 0 };
    return vehicle.upgrades.reduce((acc, upgrade) => {
        acc.speedBonus += upgrade.stats.speed || 0;
        acc.accelerationBonus += upgrade.stats.acceleration || 0;
        acc.handlingBonus += upgrade.stats.handling || 0;
        return acc;
    }, { speedBonus: 0, accelerationBonus: 0, handlingBonus: 0 });
}

const generateVehiclestats = async (vehicle) => {
    let logger = await getLogger();
    if (!vehicle) return null;
    const statBonuses = await calculateStatBonuses(vehicle);
    const speedBonus = statBonuses.speedBonus;
    const accelerationBonus = statBonuses.accelerationBonus;
    const handlingBonus = statBonuses.handlingBonus;
    const speedText = `S: ${vehicle.stats.speed} (+${speedBonus})`;
    const accelerationText = `A: ${vehicle.stats.acceleration} (+${accelerationBonus})`;
    const handlingText = `H: ${vehicle.stats.handling} (+${handlingBonus})`;

    const speed = vehicle.stats.speed + speedBonus;
    const acceleration = vehicle.stats.acceleration + accelerationBonus;
    const handling = vehicle.stats.handling + handlingBonus;

    const totalPower = speed + acceleration + handling;

    logger.debug(`Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} | S: ${totalPower} | A: ${accelerationBonus} | H: ${handlingBonus}`);

    return { totalPower, speedText, accelerationText, handlingText, speed, acceleration, handling };
}

// partBonuses
// "Turbo", "Supercharger", "Coilovers", "Suspension", "Exhaust", "Intake", "Intercooler", "Wheels", "Tires", "Brakes"
const partBonuses = {
    turbo: {
        speed: 0.4,
        acceleration: 0.5,
        handling: 0.0
    },
    supercharger: {
        speed: 0.7,
        acceleration: 0.3,
        handling: 0.0
    },
    wheels: {
        speed: 0.0,
        acceleration: 0.0,
        handling: 0.8
    },
    tires: {
        speed: 0.0,
        acceleration: 0.1,
        handling: 0.7
    },
    brakes: {
        speed: 0.0,
        acceleration: 0.0,
        handling: 0.6
    },
    suspension: {
        speed: 0.0,
        acceleration: 0.1,
        handling: 0.7
    },
    exhaust: {
        speed: 0.1,
        acceleration: 0.1,
        handling: 0.0
    },
    intake: {
        speed: 0.1,
        acceleration: 0.2,
        handling: 0.0
    },
    intercooler: {
        speed: 0.1,
        acceleration: 0.0,
        handling: 0.0
    },
    coilovers: {
        speed: 0.0,
        acceleration: 0.3,
        handling: 0.5
    }
}

async function getItemDetails(item, quantity) {
    let logger = await getLogger();
    const itemData = await Item.findOne({ itemId: item });
    if (!itemData) return null;


    if (isNaN(itemData.value) || typeof itemData.value !== 'number') {
        logger.error(`Invalid item value for ${item}: ${itemData.value}`);
        return null;
    }

    return {
        itemId: itemData.itemId,
        name: itemData.name,
        totalCost: itemData.value * (quantity || 1),
        currency: itemData.currency, // 'coins' or 'CrewTokens'
        type: itemData.type,
        enabled: itemData.enabled
    };
}

async function itemPurchase(profile, item, quantity) {
    let logger = await getLogger();
    const itemData = await Item.findOne({ itemId: item });
    if (!itemData) return;

    if (profile.coins < itemData.value * quantity) {
        return false;
    }
    if (itemData.itemId === 'junkyard_pass') {
        profile.junkyardPasses += quantity;
    } else if (itemData.itemId === 'lottery_ticket') {
        profile.luckyTokens += quantity;
    } else if (itemData.itemId === 'booster_xp') {
        profile.booster.xp = 2.0;
        profile.booster.xpExpires = DateTime.now().plus({ hours: 1 }).toJSDate();
    } else if (itemData.itemId === 'booster_coins') {
        profile.booster.coins = 2.0;
        profile.booster.coinsExpires = DateTime.now().plus({ hours: 1 }).toJSDate();
    } else {
        return false;
    }

    logger.debug(`Player ${profile.username} ${profile.coins} purchased ${quantity} ${itemData.name} for ${itemData.value * quantity} ${itemData.currency}`);

    if (itemData.currency === 'CrewTokens') {
        profile.crewTokens -= itemData.value * quantity;
    } else {
        profile.coins -= itemData.value * quantity;
    }

    await profile.save();

    const purch = {
        userId: profile.userId,
        purchaseDate: DateTime.now().setZone('America/New_York').toJSDate(),
        quantity: quantity,
        price: itemData.value * quantity,
        currency: itemData.currency
    };

    itemData.purchases.push(purch);
    await itemData.save();
}

module.exports = {
    // Fuel related functions
    passiveRefuel,
    // Level related functions
    calculateLevel,
    giveXP,
    giveCoins,
    giveItem,
    calculatePlayerScore,
    // Reward functions
    rewardsTable,
    resetStreetRaceTickets,
    resetLuckyTokens,
    calculatePassiveIncome,
    updateBooster,
    updateChallenge,
    // Vehicle upgrades
    calculateStatBonuses,
    partBonuses,
    generateVehiclestats,
    // Item functions
    getItemDetails,
    itemPurchase
};