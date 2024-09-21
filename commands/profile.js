const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Profile } = require('../models');
const { calculateLevel, calculatePlayerScore, updateChallenge, calculatePassiveIncome } = require('../utils/main');
const { generateAndCacheProfileImage } = require('../utils/profileUtils');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View player profiles.')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The player you want to view')
            .setRequired(false)),
    category: 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const profile = await Profile.findOne({ userId: targetUser.id });
        let playerVehicle = null
    
        if (!profile) {
            return interaction.reply(`${targetUser.username}'s profile does not exist.`, { ephemeral: true });
        }
        
        
        playerVehicle = profile.vehicles.find(v => v.isActive);
        if (!playerVehicle) {
            logger.warn(`${targetUser.username} has no active vehicle.`);
            return interaction.reply('This user does not have an active vehicle.', { ephemeral: true });
        }

        try {
            const profileImg = await generateAndCacheProfileImage(profile);
            const attachment = new AttachmentBuilder(profileImg, { name: 'profile.png' });
            const crewTag = profile.crew ? '\u200B\u200B\u200B['+profile.crew+']' : '';
            const levelInfo = await calculateLevel(profile.xp);
            const playerPower = await calculatePlayerScore(profile);
            await updateChallenge(profile, 'checkProfile');
            const passiveIncome = await calculatePassiveIncome(profile);
            const cleanCoins = Math.floor(profile.coins);
            
            const embed = new EmbedBuilder()
                .setColor(profile.settings.customColor || '#00ff00')
                .setTitle(`:mag:  ${profile.username} - Level ${profile.level} ${crewTag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(`**Power** - ${playerPower} ⚡`)
                .setImage('attachment://profile.png')
                .addFields(
                { name: 'Coins', value: `<:coins:1269411594685644800> ${cleanCoins.toLocaleString()}`, inline: true },
                { name: 'Tokens', value: `<:lotterytoken:1269399775065804862> ${profile.luckyTokens.toLocaleString()}\n<:crewtoken:1269432351407083610> ${profile.crewTokens.toLocaleString()}\n<:junkyardpass:1273688549429870633> ${profile.junkyardPasses.toLocaleString()}`, inline: true },
                { name: 'Feast', value: `<:feastSupplies:1286849566523654269> ${profile.feastSupplies}\n<:couponBasic:1286853815550742538> ${profile.supplyCouponT1}\n<:couponPremium:1286853816859365408> ${profile.supplyCouponT2}`, inline: true },
                { name: 'Streetraces', value: `${profile.streetRaceStats.wins}W / ${profile.streetRaceStats.losses}L\n(${profile.streetRaceCount} Total)`, inline: true },
                { name: 'Dailies Collected', value: `${profile.dailyCount}`, inline: true },
                { name: 'Weeklies Collected', value: `${profile.weeklyCount}`, inline: true },
                { name: 'Jobs Worked', value: `${profile.workCount}`, inline: true },
                { name: 'Boosters', value: `XP: ${profile.booster.xp}x\nCoin: ${profile.booster.coins}x`, inline: true },
                { name: 'Income', value: `<:coins:1269411594685644800> ${passiveIncome.moneyIncome.toLocaleString()}/hr\nXP ${passiveIncome.xpIncome.toLocaleString()}/hr`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: 'Active Vehicle', value: `${playerVehicle.make} ${playerVehicle.model}\nFuel: ${playerVehicle.stats.currentFuel.toLocaleString()}%`, inline: false }
                )
                .setFooter({ text: `XP: ${Math.floor(profile.xp)} / ${Math.floor(levelInfo.nextLevelXp)} | ${Math.floor(levelInfo.remainingXp)} to next level` });
            
            interaction.reply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            logger.error(interaction.user.tag+' | profile: '+error);
            interaction.reply('An error occurred while generating the profile.', { ephemeral: true });
        }
    }
};
