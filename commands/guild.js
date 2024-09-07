const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Profile, GuildSettings } = require('../models');
const { getLogger } = require('../utils/logging');
const { getSetting } = require('../utils/settingsCache');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('View guild information and settings.'),
    category: 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const botVersion = await getSetting('botVersion');
        try {
            const guildSettings = await GuildSettings.findOne({ guildId: interaction.guild.id });
            if (!guildSettings) {
                return interaction.reply('Guild settings not found.', { ephemeral: true });
            }

            let allowedChannels = guildSettings.allowedChannels.map(c => `<#${c}>`).join(', ');
            allowedChannels = allowedChannels || 'Not set';

            const levelUpNotifications = guildSettings.levelupMessages ? 'Enabled' : 'Disabled';
            const levelUpChannel = guildSettings.levelupChannel ? `<#${guildSettings.levelupChannel}>` : 'Not set';

            const profiles = await Profile.find({ guildId: interaction.guild.id });
            let totalCoins = profiles.reduce((acc, profile) => acc + profile.coins, 0);
            let totalXp = profiles.reduce((acc, profile) => acc + profile.xp, 0);
            totalCoins = Math.floor(totalCoins);
            totalXp = Math.floor(totalXp);

            const totalRaces = profiles.reduce((acc, profile) => acc + profile.streetRaceCount, 0);
            const totalWins = profiles.reduce((acc, profile) => acc + profile.streetRaceStats.wins, 0);
            const totalLosses = profiles.reduce((acc, profile) => acc + profile.streetRaceStats.losses, 0);
            const totalDailyCount = profiles.reduce((acc, profile) => acc + profile.dailyCount, 0);
            const totalWeeklyCount = profiles.reduce((acc, profile) => acc + profile.weeklyCount, 0);

            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Guild Information - ${interaction.guild.name}`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
                .setDescription(`**Settings**\nLevel Up Notifications: ${levelUpNotifications}\nLevel Up Channel: ${levelUpChannel}\nAllowed Channels: ${allowedChannels}\n*Use /settings command to change settings.*`)
                .addFields(
                { name: 'Players:', value: `${profiles.length}`, inline: true },
                { name: 'Total Coins', value: `<:coins:1269411594685644800> ${totalCoins.toLocaleString()}`, inline: true },
                { name: 'Total XP', value: `${totalXp.toLocaleString()}`, inline: true },
                { name: 'Total Races', value: `${totalWins}W / ${totalLosses}L\n(${totalRaces} Total)`, inline: true },
                { name: 'Dailies Collected', value: `${totalDailyCount}`, inline: true },
                { name: 'Weeklies Collected', value: `${totalWeeklyCount}`, inline: true }
                )
                .setFooter({ text: `${botVersion}`});
            
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(interaction.user.tag+' | guild: '+error);
            interaction.reply('An error occurred while generating the profile.', { ephemeral: true });
        }
    }
};
