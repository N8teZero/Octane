const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Profile } = require('../models');
const { calculateLevel, calculatePlayerScore, updateChallenge, generateVehiclestats } = require('../utils/main');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View player stats.')
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
            const crewTag = profile.crew ? '\u200B\u200B\u200B['+profile.crew+']' : '';
            const levelInfo = await calculateLevel(profile.xp);
            const playerPower = await calculatePlayerScore(profile);
            const vehicleStats = await generateVehiclestats(profile, playerVehicle);
            const vehicleFuelRemaining = Math.floor((playerVehicle.stats.currentFuel / playerVehicle.stats.fuelCapacity) * 100);
            await updateChallenge(profile, 'checkStats');
            
            
            const embed = new EmbedBuilder()
                .setColor(profile.settings.customColor || '#00ff00')
                .setTitle(`:bar_chart:  ${profile.username} - Level ${profile.level} ${crewTag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(`**Power** - ${playerPower} ⚡`)
                .addFields(
                    { name: 'Active Vehicle', value: `${playerVehicle.make} ${playerVehicle.model}`, inline: false },
                    { name: 'Vehicle Stats', value: `Speed: ${playerVehicle.stats.speed.toFixed(1)}\nAccel: ${playerVehicle.stats.acceleration.toFixed(1)}\nGrip: ${playerVehicle.stats.grip.toFixed(1)}\nSuspension: ${playerVehicle.stats.suspension.toFixed(1)}\nBrakes: ${playerVehicle.stats.brakes.toFixed(1)}\nTorque: ${playerVehicle.stats.torque.toFixed(1)}\nHorsepower: ${playerVehicle.stats.horsepower.toFixed(1)}\nAero: ${playerVehicle.stats.aerodynamics.toFixed(1)}`, inline: false },
                    { name: 'Upgrades', value: `Speed: ${vehicleStats.speedUpgrade.toFixed(1)}\nAccel: ${vehicleStats.accelUpgrade.toFixed(1)}\nGrip: ${vehicleStats.gripUpgrade.toFixed(1)}\nSuspension: ${vehicleStats.suspensionUpgrade.toFixed(1)}\nBrakes: ${vehicleStats.brakesUpgrade.toFixed(1)}\nTorque: ${vehicleStats.torqueUpgrade.toFixed(1)}\nHorsepower: ${vehicleStats.horsepowerUpgrade.toFixed(1)}\nAero: ${vehicleStats.aeroUpgrade.toFixed(1)}`, inline: false },
                    { name: 'Shrine', value: `Speed: ${vehicleStats.speedBonus.toFixed(1)}\nAccel: ${vehicleStats.accelBonus.toFixed(1)}\nGrip: ${vehicleStats.gripBonus.toFixed(1)}\nSuspension: ${vehicleStats.suspensionBonus.toFixed(1)}\nBrakes: ${vehicleStats.brakesBonus.toFixed(1)}\nTorque: ${vehicleStats.torqueBonus.toFixed(1)}\nHorsepower: ${vehicleStats.horsepowerBonus.toFixed(1)}\nAero: ${vehicleStats.aeroBonus.toFixed(1)}`, inline: false },
                
                )
                .setFooter({ text: `Fuel: ${playerVehicle.stats.currentFuel} / ${playerVehicle.stats.fuelCapacity} | ${vehicleFuelRemaining} remaining` });
            
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(interaction.user.tag+' | stats: '+error);
            interaction.reply('An error occurred while generating the profile.', { ephemeral: true });
        }
    }
};
