const Profile = require('../models/Profile');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord-api-types/v9');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the leaderboard')
        .addStringOption(option => 
            option.setName('view')
                .setDescription('View guild or global leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Global', value: 'global' },
                    { name: 'Guild', value: 'guild' }
                ))
        .addStringOption(option => 
            option.setName('sort')
                .setDescription('Sort by XP, Coins, Level')
                .setRequired(true)
                .addChoices(
                    { name: 'XP', value: 'xp' },
                    { name: 'Coins', value: 'coins' },
                    { name: 'Level', value: 'level' }
                )),
    category: 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const sort = interaction.options.getString('sort') || 'xp';
        const view = interaction.options.getString('view') || 'global';
        let sortField = sort === 'coins' ? 'coins' : sort === 'level' ? 'level' : 'xp';
        const sortOrder = sort === 'coins' ? -1 : -1;

        const query = view === 'guild' ? { guildId: interaction.guild.id } : {};
        const players = await Profile.find(query).sort({ [sortField]: sortOrder }).lean();
        const pageLimit = 5;
        let page = 0;
        const leaderboard = view === 'guild' ? 'Guild' : 'Global';
    
        function generateEmbed(start) {
            const current = players.slice(start, start + pageLimit);
            const embed = new EmbedBuilder()
                .setTitle(`**${leaderboard} Leaderboard** - *Sorted by ${sortField} in descending order*`)
                .setDescription(current.map(player => {
                    const crewString = player.crew ? `**[${player.crew}]**` : "";
                    return `${crewString} ${player.username} | <@${player.userId}>\n` +
                    `┣ Joined: ${player.joinDate.toLocaleDateString()} - Last Active: ${player.lastMessageDate.toLocaleDateString()}\n` +
                    `┗ Level: ${player.level} | XP: ${Math.floor(player.xp)} | Coins: ${Math.floor(player.coins).toLocaleString()}`;
                }).join('\n\n'))
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(players.length / pageLimit)}` })
                .setColor(0x00AE86);
    
            return embed;
        }
    
        const embed = generateEmbed(0);
        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        if (players.length <= pageLimit) return;
    
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary)
            );
    
        await interaction.editReply({ embeds: [embed], components: [row] });
        const filter = i => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        try {
            collector.on('collect', async i => {
                if (i.customId === 'next' && page < Math.ceil(players.length / pageLimit) - 1) {
                    page++;
                } else if (i.customId === 'previous' && page > 0) {
                    page--;
                }
        
                const newEmbed = generateEmbed(page * pageLimit);
                await i.update({
                    embeds: [newEmbed],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                            new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(page === Math.ceil(players.length / pageLimit) - 1)
                        )
                    ]
                });
            });
            collector.on('end', () => interaction.editReply({ components: [] }));
        } catch (error) {
            logger.error(interaction.user.tag+' | leaderboard: '+error);
        }
    }
};
