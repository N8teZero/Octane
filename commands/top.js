const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { GuildSettings, Profile } = require('../models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('View top guilds.')
        .addStringOption(option => 
            option.setName('metric')
                .setDescription('Metric to rank guilds by')
                .setRequired(true)
                .addChoices(
                    { name: 'XP', value: 'xp' },
                    { name: 'Coins', value: 'coins' }
                )),
    category : 'General',
    async execute(interaction) {
        const metric = interaction.options.getString('metric');

        const guildStats = await Profile.aggregate([
            { $group: {
                _id: "$guildId",
                totalXp: { $sum: "$xp" },
                totalCoins: { $sum: "$coins" },
                count: { $sum: 1 }
            }},
            { $sort: { [`total${metric.charAt(0).toUpperCase() + metric.slice(1)}`]: -1 }},
            { $limit: 10 }
        ]);

        const guildIds = guildStats.map(stats => stats._id);
        const guilds = await GuildSettings.find({ guildId: { $in: guildIds }});

        const embed = new EmbedBuilder()
            .setTitle(`Top Guilds by ${metric.charAt(0).toUpperCase() + metric.slice(1)}`)
            .setColor(0x00AE86);

        guildStats.forEach((stats, index) => {
            const guildName = guilds.find(g => g.guildId === stats._id)?.name || 'Unknown Guild';
            embed.addFields({
                name: `#${index + 1} ${guildName}`,
                value: `Total ${metric}: ${stats[`total${metric.charAt(0).toUpperCase() + metric.slice(1)}`].toLocaleString()} - Members: ${stats.count}`
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};
