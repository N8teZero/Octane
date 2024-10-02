const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Profile } = require('../models');
const { generateVehiclestats, generateStatsText } = require('../utils/main');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('practice')
        .setDescription('Practice race against another player.')
        .addUserOption(option => 
            option.setName('opponent')
                .setDescription('The player you want to race against')
                .setRequired(true)),
    category: 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const opponentUser = interaction.options.getUser('opponent');
        const profile = await Profile.findOne({ userId: interaction.user.id });
        const opponentProfile = await Profile.findOne({ userId: opponentUser.id });

        if (!profile || !opponentProfile) {
            await interaction.reply({ content: "Both players need to have a profile and an active vehicle to race.", ephemeral: true });
            return;
        }

        const playerVehicle = profile.vehicles.find(v => v.isActive);
        const opponentVehicle = opponentProfile.vehicles.find(v => v.isActive);

        if (!playerVehicle || !opponentVehicle) {
            await interaction.reply({ content: "Both players need to have an active vehicle to race.", ephemeral: true });
            return;
        }

        if (profile.userId === opponentProfile.userId) {
            await interaction.reply({ content: "You cannot race against yourself.", ephemeral: true });
            return;
        }

        try {
            await interaction.deferReply();

            const playerStats = await generateVehiclestats(profile, playerVehicle);
            const opponentStats = await generateVehiclestats(opponentProfile, opponentVehicle);
            const playerStatsText = await generateStatsText(playerStats);
            const opponentStatsText = await generateStatsText(opponentStats);
            
            const playerPower = playerStats.totalPower;
            const opponentPower = opponentStats.totalPower;

            const result = playerPower >= opponentPower;

            const embed = new EmbedBuilder()
                .setTitle(':checkered_flag: Practice Race Results')
                .addFields(
                    { name: `${profile.username}`, value: `${playerVehicle.make} ${playerVehicle.model}`, inline: true },
                    { name: 'Power', value: `${playerPower}`, inline: true },
                    { name: 'Stats', value: `${playerStatsText.speedText}\n${playerStatsText.accelText}\n${playerStatsText.handlingText}`, inline: true },
                    { name: `${opponentProfile.username}`, value: `${opponentVehicle.make} ${opponentVehicle.model}`, inline: true },
                    { name: 'Power', value: `${opponentPower}`, inline: true },
                    { name: 'Stats', value: `${opponentStatsText.speedText}\n${opponentStatsText.accelText}\n${opponentStatsText.handlingText}`, inline: true },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: 'Result', value: result ? `${profile.username} won!` : `${opponentProfile.username} won!`, inline: false }
                )
                .setColor(result ? '#00FF00' : '#FF0000');

            await interaction.followUp({ embeds: [embed] });
        } catch (err) {
            logger.error(interaction.user.tag+' | practice: '+err);
            await interaction.followUp({ content: "An error occurred while simulating the race.", ephemeral: true });
        }
    }
};
