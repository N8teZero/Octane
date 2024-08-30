const Profile = require('../models/Profile');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord-api-types/v9');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the leaderboard')
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
        let sortField = sort === 'coins' ? 'coins' : sort === 'level' ? 'level' : 'xp';
        const sortOrder = sort === 'coins' ? -1 : -1;

        const guildPlayers = await Profile.find({ guildId: interaction.guild.id }).sort({ [sortField]: sortOrder }).lean();
        const globalPlayers = await Profile.find({}).sort({ [sortField]: sortOrder }).lean();

        let page = 0;
        let leaderboard = 'Guild';
        let players = guildPlayers;
    
        function generateEmbed(start, players) {
            const current = players.slice(start, start + 5);
            if (!current.length) {
                return new EmbedBuilder()
                    .setTitle(`**${leaderboard} Leaderboard** - *Sorted by ${sortField} in descending order*`)
                    .setDescription(`No players assigned to this guild.`)
                    .setColor(0x00AE86);
            }
            return new EmbedBuilder()
                .setTitle(`**${leaderboard} Leaderboard** - *Sorted by ${sortField} in descending order*`)
                .setDescription(current.map(player => {
                    const crewString = player.crew ? `**[${player.crew}]**` : "";
                    return `${crewString} ${player.username} | <@${player.userId}>\n` +
                    `┣ Joined: ${player.joinDate.toLocaleDateString()} - Last Active: ${player.lastMessageDate.toLocaleDateString()}\n` +
                    `┗ Level: ${player.level} | XP: ${Math.floor(player.xp)} | Coins: ${Math.floor(player.coins).toLocaleString()}`;
                }).join('\n\n'))
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(players.length / 5)}` })
                .setColor(0x00AE86);
        }
    
        const embed = generateEmbed(0, players);
        const row = new ActionRowBuilder();

        row.addComponents(
            new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(players.length <= 5),
            new ButtonBuilder().setCustomId('guild').setLabel('Guild').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('global').setLabel('Global').setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const collector = message.createMessageComponentCollector({ time: 60000 });

        function generateButtons(page, players) {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled((page + 1) * 5 >= players.length),
                    new ButtonBuilder()
                        .setCustomId('guild')
                        .setLabel('Guild')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('global')
                        .setLabel('Global')
                        .setStyle(ButtonStyle.Primary)
                );
        }

        collector.on('collect', async i => {
            if (['next', 'previous'].includes(i.customId)) {
                if (i.customId === 'next' && (page + 1) * 5 < players.length) {
                    page++;
                } else if (i.customId === 'previous' && page > 0) {
                    page--;
                }
                await i.update({ embeds: [generateEmbed(page * 5, players)], components: [generateButtons(page, players)] });
            } else if (i.customId === 'guild' || i.customId === 'global') {
                leaderboard = i.customId.charAt(0).toUpperCase() + i.customId.slice(1);
                players = i.customId === 'guild' ? guildPlayers : globalPlayers;
                page = 0;
                await i.update({ embeds: [generateEmbed(0, players)], components: [generateButtons(page, players)] });
            }
        });

        collector.on('end', () => interaction.editReply({ components: [] }));
    }
};
