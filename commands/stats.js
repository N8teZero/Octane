const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Profile } = require('../models');
const { calculateLevel, calculatePlayerScore, updateChallenge } = require('../utils/main');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View player stats')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user whose profile you want to view')
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
            const crewTag = profile.crew ? '\u200B\u200B\u200B['+profile.crew+']' : '';
            const levelInfo = await calculateLevel(profile.xp);
            const playerPower = await calculatePlayerScore(profile);
            const vehicleStats = await generateVehiclestats(profile); // continue this later; adding vehicle stats and upgrades
            await updateChallenge(profile, 'checkStats');
            
            
            const embed = new EmbedBuilder()
                .setColor(profile.settings.customColor || '#00ff00')
                .setTitle(`:mag:  ${profile.username} - Level ${profile.level} ${crewTag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(`**Power** - ${playerPower} ⚡`)
                .addFields(
                    { name: 'Active Vehicle', value: `${playerVehicle.make} ${playerVehicle.model}`, inline: false },
                    { name: 'Stats', value: `Speed: ${playerVehicle.stats.speed}\nAcceleration: ${playerVehicle.stats.acceleration}\nHandling: ${playerVehicle.stats.handling}`, inline: true },
                    { name: 'Upgrades', value: playerVehicle.upgrades.map(u => `${u.type} - Lvl ${u.level}`).join('\n'), inline: true },
                    { name: 'Shrine', value: `Speed: ${profile.stats.speed}\nAcceleration: ${profile.stats.acceleration}\nHandling: ${profile.stats.handling}`, inline: true },
                
                )
                .setFooter({ text: `XP: ${Math.floor(profile.xp)} / ${Math.floor(levelInfo.nextLevelXp)} | ${Math.floor(levelInfo.remainingXp)} to next level` });
            
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(interaction.user.tag+' | stats: '+error);
            interaction.reply('An error occurred while generating the profile.', { ephemeral: true });
        }
    }
};
