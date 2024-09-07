const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Profile, Challenge } = require('../models');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('challenges')
        .setDescription('View challenge progress.'),
    category: 'Rewards',
    async execute(interaction) {
        let logger = await getLogger();
        const dailyChallenges = await Challenge.find({ category: 'daily' }).sort({ name: 1 }).lean();
        const starterChallenges = await Challenge.find({ category: 'starter' }).sort({ name: 1 }).lean();
        let profile = await Profile.findOne({ userId: interaction.user.id });

        let page = 0;
        let currentCategory = 'Daily';
        let challenges = dailyChallenges;  // Default to Daily challenges

        function generateEmbed(start, challenges) {
            const currentChallenges = challenges.slice(start, start + 5);
            return new EmbedBuilder()
                .setTitle(`**${currentCategory} Challenges**`)
                .setDescription(currentChallenges.map((ch, index) => {
                    const challengeProgress = profile.challenges.find(chal => chal.challengeId.equals(ch._id));
                    const progress = challengeProgress ? challengeProgress.progress : 0;
                    const completed = challengeProgress && challengeProgress.progress >= ch.targetCount ? ':white_check_mark:' : ':hourglass:';
                    return `**${index + 1}**. ${ch.name} (${completed} ${progress}/${ch.targetCount})\nRewards: ${ch.xpReward} XP, ${ch.coinReward} Coins\n${ch.description}`;
                }).join('\n\n'))
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(challenges.length / 5)}` })
                .setColor(0x00AE86);
        }

        const embed = generateEmbed(0, challenges);
        const row = new ActionRowBuilder();

        row.addComponents(
            new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(challenges.length <= 5),
            new ButtonBuilder().setCustomId('daily').setLabel('Daily').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('starter').setLabel('Starter').setStyle(ButtonStyle.Success)
        );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const collector = message.createMessageComponentCollector({ time: 60000 });

        function generateButtons(page, challenges) {
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
                        .setDisabled((page + 1) * 5 >= challenges.length),
                    new ButtonBuilder()
                        .setCustomId('daily')
                        .setLabel('Daily')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('starter')
                        .setLabel('Starter')
                        .setStyle(ButtonStyle.Success)
                );
        }

        collector.on('collect', async i => {
            if (['next', 'previous'].includes(i.customId)) {
                if (i.customId === 'next' && (page + 1) * 5 < challenges.length) {
                    page++;
                } else if (i.customId === 'previous' && page > 0) {
                    page--;
                }
                await i.update({ embeds: [generateEmbed(page * 5, challenges)], components: [generateButtons(page, challenges)] });
            } else if (i.customId === 'daily' || i.customId === 'starter') {
                currentCategory = i.customId.charAt(0).toUpperCase() + i.customId.slice(1);
                challenges = i.customId === 'daily' ? dailyChallenges : starterChallenges;
                page = 0;
                await i.update({ embeds: [generateEmbed(0, challenges)], components: [generateButtons(page, challenges)] });
            }
        });

        collector.on('end', () => interaction.editReply({ components: [] }));
    }
};
