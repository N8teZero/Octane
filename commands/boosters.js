const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Profile = require('../models/Profile');
const { DateTime } = require('luxon');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boosters')
        .setDescription('Manage and buy boosters.'),
    category: 'Economy',
    async execute(interaction) {
    let logger = await getLogger();
        const profile = await Profile.findOne({ userId: interaction.user.id });

        if (!profile) {
            await interaction.reply('No profile found.', { ephemeral: true });
            return;
        }

        const now = DateTime.now().setZone('America/New_York');
        const xpActive = profile.booster.xpExpires > now;
        const coinsActive = profile.booster.coinsExpires > now;
        const xpBooster = { name: 'XP Booster', price: 500, duration: 60 };
        const coinsBooster = { name: 'Coins Booster', price: 500, duration: 60 };

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🚀 Your Boosters')
            .setDescription('Here you can buy boosters to enhance your game experience.\n\nBoosters double your XP and Coins earnings for a limited time.')
            .addFields(
                { name: `2x XP Booster: ${xpBooster.price} <:coins:1269411594685644800>`, value: xpActive ? `Active: ${profile.booster.xp}x until ${profile.booster.xpExpires.toLocaleString(DateTime.DATETIME_MED)}` : 'Use `/buy booster_xp` to purchase' },
                { name: `2x Coins Booster: ${coinsBooster.price} <:coins:1269411594685644800>`, value: coinsActive ? `Active: ${profile.booster.coins}x until ${profile.booster.coinsExpires.toLocaleString(DateTime.DATETIME_MED)}` : 'Use `/buy booster_coins` to purchase' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Your Coins', value: `${profile.coins} <:coins:1269411594685644800>` }
            )
            .setFooter({ text: `Booster Duration: ${xpBooster.duration} minutes` });

        await interaction.reply({ embeds: [embed] });
    }
};
