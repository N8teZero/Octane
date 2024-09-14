const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Profile } = require('../models');
const { calculateLevel, calculatePlayerScore, updateChallenge, generateVehiclestats } = require('../utils/main');
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
            const vehicleStats = await generateVehiclestats(profile, playerVehicle); // continue this later; adding vehicle stats and upgrades
            await updateChallenge(profile, 'checkStats');
            
            
            const embed = new EmbedBuilder()
                .setColor(profile.settings.customColor || '#00ff00')
                .setTitle(`:bar_chart:  ${profile.username} - Level ${profile.level} ${crewTag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(`**Power** - ${playerPower} ⚡`)
                .addFields(
                    { name: 'Active Vehicle', value: `${playerVehicle.make} ${playerVehicle.model}`, inline: false },
                    { name: 'Vehicle Stats', value: `Speed: ${playerVehicle.stats.speed}\nAccel: ${playerVehicle.stats.acceleration}\nGrip: ${playerVehicle.stats.grip}\nSuspension: ${playerVehicle.stats.suspension}\nBrakes: ${playerVehicle.stats.brakes}\nTorque: ${playerVehicle.stats.torque}\nHorsepower: ${playerVehicle.stats.horsepower}\nAero: ${playerVehicle.stats.aerodynamics}`, inline: false },
                    { name: 'Upgrades', value: `Speed: ${vehicleStats.speedUpgrade}\nAccel: ${vehicleStats.accelUpgrade}\nGrip: ${vehicleStats.gripUpgrade}\nSuspension: ${vehicleStats.suspensionUpgrade}\nBrakes: ${vehicleStats.brakesUpgrade}\nTorque: ${playerVehicle.stats.torque}\nHorsepower: ${playerVehicle.stats.horsepower}\nAero: ${playerVehicle.stats.aerodynamics}`, inline: false },
                    { name: 'Shrine', value: `Speed: ${vehicleStats.speedBonus}\nAccel: ${vehicleStats.accelBonus}\nGrip: ${vehicleStats.gripBonus}\nSuspension: ${vehicleStats.suspensionBonus}\nBrakes: ${vehicleStats.brakesBonus}\nTorque: ${playerVehicle.stats.torque}\nHorsepower: ${playerVehicle.stats.horsepower}\nAero: ${playerVehicle.stats.aerodynamics}`, inline: false },
                
                )
                .setFooter({ text: `XP: ${Math.floor(profile.xp)} / ${Math.floor(levelInfo.nextLevelXp)} | ${Math.floor(levelInfo.remainingXp)} to next level` });
            
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(interaction.user.tag+' | stats: '+error);
            interaction.reply('An error occurred while generating the profile.', { ephemeral: true });
        }
    }
};
