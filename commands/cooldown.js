const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Profile = require('../models/Profile');
const { DateTime } = require('luxon');
const { resetLuckyTokens } = require('../utils/main');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cooldowns')
        .setDescription('Check and refresh the cooldowns for your next daily and weekly rewards.'),
    category: 'General',
    async execute(interaction) {
        let logger = await getLogger();
        const profile = await Profile.findOne({ userId: interaction.user.id });

        if (!profile) {
            return interaction.reply({ content: 'You do not have a profile yet.', ephemeral: true });
        }

        try {
            const now = DateTime.now().setZone('America/New_York');
            await resetLuckyTokens(profile);
            const embed = buildCooldownEmbed(profile, now);
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refresh_cooldowns')
                        //.setLabel(':arrows_counterclockwise:')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🔄')
                        .setDisabled(false)
                );

            const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

            const filter = i => i.customId === 'refresh_cooldowns' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 }); // 30 seconds to listen

            collector.on('collect', async i => {
                if (i.customId === 'refresh_cooldowns') {
                    i.deferUpdate();
                    await new Promise(resolve => setTimeout(resolve, 30000)); // Disable for 30 seconds
                    const newEmbed = buildCooldownEmbed(profile, DateTime.now().setZone('America/New_York'));
                    i.editReply({ embeds: [newEmbed], components: [row.setComponents(row.components[0].setDisabled(true))] });
                    setTimeout(async () => {
                        row.setComponents(row.components[0].setDisabled(false));
                        await i.editReply({ components: [row] });
                    }, 30000);
                }
            });
        } catch (error) {
            logger.error(interaction.user.tag + ' | cooldowns: ' + error);
            return interaction.reply({ content: 'An error occurred while checking cooldowns.', ephemeral: true });
        }
    }
};

function buildCooldownEmbed(profile, now) {
    let lastDaily = profile.lastDaily ? DateTime.fromJSDate(profile.lastDaily) : now.minus({ days: 1 });
    let lastWeekly = profile.lastWeekly ? DateTime.fromJSDate(profile.lastWeekly) : now.minus({ weeks: 1 });
    
    let nextDailyReset = lastDaily.plus({ days: 1 }).startOf('day');
    let nextWeeklyReset = lastWeekly.plus({ weeks: 1 }).startOf('week');

    const dailyResetString = now >= nextDailyReset ? ':white_check_mark:' : ':no_entry: '+nextDailyReset.diff(now).toFormat("hh 'hours', mm 'minutes'");
    const weeklyResetString = now >= nextWeeklyReset ? ':white_check_mark:' : ':no_entry: '+nextWeeklyReset.diff(now).toFormat("dd 'days', hh 'hours'");
    

    const workCooldown = profile.lastWorkTime && now.diff(DateTime.fromJSDate(profile.lastWorkTime)).as('milliseconds') < 1200000
        ? `:no_entry: ${Math.round((1200000 - now.diff(DateTime.fromJSDate(profile.lastWorkTime)).as('milliseconds')) / 60000)} minutes` 
        : ':white_check_mark:';
    

    const playerVehicle = profile.vehicles.find(v => v.isActive);
    let fuelCost = 25;
    let raceCooldown;
    if (playerVehicle.stats.currentFuel < fuelCost) {
        raceCooldown = ':no_entry: No fuel, use `/refuel` to top up.';
    } else {
        raceCooldown = `:white_check_mark: ${playerVehicle.stats.currentFuel}% Fuel`;
    }

    const lotteryCooldown = profile.luckyTokens && profile.luckyTokens > 0 ? `:white_check_mark: ${profile.luckyTokens} Lucky Tokens` : ':no_entry: '+nextDailyReset.diff(now).toFormat("hh 'hours', mm 'minutes'");

    const afkCooldown = profile.lastAFKClaim && now.diff(DateTime.fromJSDate(profile.lastAFKClaim)).as('milliseconds') < 300000  // 5 minutes in ms = 300000
        ? `:no_entry: ${Math.round((300000 - now.diff(DateTime.fromJSDate(profile.lastAFKClaim)).as('milliseconds')) / 60000)} minutes` 
        : ':white_check_mark:';

    const timeRemaining = 30 - DateTime.now().diff(DateTime.fromJSDate(profile.lastRefuel)).as('minutes');
    const readyToRefuel = profile.lastRefuel && DateTime.now().diff(DateTime.fromJSDate(profile.lastRefuel)).as('minutes') < 30
        ? `:no_entry: ${Math.ceil(timeRemaining).toLocaleString()} minutes`
        : ':white_check_mark:';

    return new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`Your Cooldowns`)
        .addFields(
            { name: 'AFK Rewards', value: `${afkCooldown}`, inline: false },
            { name: 'Work', value: `${workCooldown}`, inline: false },
            { name: 'Race', value: `${raceCooldown}`, inline: false },
            { name: 'Lottery', value: `${lotteryCooldown}`, inline: false },
            { name: 'Daily', value: `${dailyResetString}`, inline: false },
            { name: 'Weekly', value: `${weeklyResetString}`, inline: false },
            { name: 'Refuel', value: `${readyToRefuel}`, inline: false }                
        )
        .setFooter({ text: `Refreshed ${now.toLocaleString(DateTime.DATETIME_MED)}` });
}
