// commands/challenge.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Profile = require('../models/Profile');
const { calculateWorkReward, giveXP, giveCoins, passiveRefuel } = require('../utils/main');
const { DateTime } = require('luxon');
const Challenge = require('../models/Challenge');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('challenges')
        .setDescription('View daily challenge progress.'),
    category: 'Rewards',
    async execute(interaction) {
    let logger = await getLogger();
        const challenges = await Challenge.find({ daily: true }).sort({ name: 1 }).lean();
        let profile = await Profile.findOne({ userId: interaction.user.id });
        let page = 0;
        const pageLimit = 5;

        function generateEmbed(start) {
            try {
                const currentChallenges = challenges.slice(start, start + pageLimit);
                const embed = new EmbedBuilder()
                    .setTitle('**Daily Challenges**')
                    .setDescription('*Complete these challenges to earn rewards. Challenges reset and rewards granted at 05:00 UTC.*\n\n' +
                        currentChallenges.map((ch, index) => {
                        const challengeProgress = profile.challenges.find(chal => chal.challengeId.equals(ch._id));
                        const progress = challengeProgress ? challengeProgress.progress : '0';
                        const progressEmoji = challengeProgress && challengeProgress.progress >= ch.targetCount ? ':white_check_mark:' : ':hourglass:';
                        return `**${index + 1}**. ${ch.name}: ${ch.description}\nRewards: ${ch.xpReward} XP, ${ch.coinReward} Coins\nProgress: ${progressEmoji} ${progress}/${ch.targetCount}`;
                    }).join('\n\n'))
                    .setFooter({ text: `Page ${page + 1} of ${Math.ceil(challenges.length / pageLimit)}` })
                    .setColor(0x00AE86);
    
                return embed;
            } catch (err) {
                logger.error(interaction.user.tag+' | challenges: '+err);
                return interaction.reply('An error occurred while generating the challenges list.', { ephemeral: true });
            }
        }

        const embed = generateEmbed(0);
        const rows = [];
        const buttons = [];

        if (challenges.length > pageLimit) {
            buttons.push(new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0));
            buttons.push(new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled((page + 1) * pageLimit >= challenges.length));
        }

        if (buttons.length > 0) {
            rows.push(new ActionRowBuilder().addComponents(buttons));
        }

        try {
            const message = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });
            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });
    
            collector.on('collect', async i => {
                if (i.customId === 'next' && page < Math.ceil(challenges.length / pageLimit) - 1) {
                    page++;
                    await i.update({ embeds: [generateEmbed(page * pageLimit)], components: rows });
                } else if (i.customId === 'previous' && page > 0) {
                    page--;
                    await i.update({ embeds: [generateEmbed(page * pageLimit)], components: rows });
                }
            });
    
            collector.on('end', () => interaction.editReply({ components: [] }));
        } catch (err) {
            logger.error(interaction.user.tag+' | challenges: '+err);
            return interaction.reply('An error occurred while generating the challenges list.', { ephemeral: true });
        }
    }
};
