const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/Profile');
const { DateTime } = require('luxon');
const { giveXP, giveCoins, resetLuckyTokens } = require('../utils/main');
const { getLogger } = require('../utils/logging');

const prizes = [
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 0.5, reward: { type: 'coin', value: 3000 } },
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 1, reward: { type: 'coin', value: 300 } },
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 1.5, reward: { type: 'coin', value: 150 } },
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 2, reward: { type: 'coin', value: 75 } },
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 4, reward: { type: 'coin', value: 50 } },
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 6, reward: { type: 'coin', value: 25 } },
    { emoji: '<:coins:1269411594685644800>', description: 'Coin', probability: 7, reward: { type: 'coin', value: 10 } },

    { emoji: '💡', description: 'XP', probability: 1, reward: { type: 'xp', value: 1250 } },
    { emoji: '💡', description: 'XP', probability: 2, reward: { type: 'xp', value: 500 } },
    { emoji: '💡', description: 'XP', probability: 3, reward: { type: 'xp', value: 275 } },
    { emoji: '💡', description: 'XP', probability: 4, reward: { type: 'xp', value: 150 } },
    { emoji: '💡', description: 'XP', probability: 6, reward: { type: 'xp', value: 75 } },
    { emoji: '💡', description: 'XP', probability: 8, reward: { type: 'xp', value: 45 } },
    { emoji: '💡', description: 'XP', probability: 10, reward: { type: 'xp', value: 30 } },
    { emoji: '💡', description: 'XP', probability: 12, reward: { type: 'xp', value: 15 } }
];


async function calculateLotteryReward() {
    const rand = Math.random() * 50;
    let sum = 0;
    for (const prize of prizes) {
        sum += prize.probability;
        if (rand < sum) {
            return prize;
        }
    }

    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('Spin the wheel to win prizes! Requires Lucky Tokens.')
        .addIntegerOption(option => option.setName('count').setDescription('Number of tokens to use').setMinValue(1).setMaxValue(10).setRequired(false)),
    category: 'Rewards',
    async execute(interaction, guildSettings, client) {
        let profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            return interaction.reply('You need a profile to participate in the lottery.', { ephemeral: true });
        }
        profile = await resetLuckyTokens(profile);
        const count = interaction.options.getInteger('count') || 1;
        if (profile.luckyTokens < count) {
            return interaction.reply(`You need ${count} Lucky Token(s) to play the lottery this many times.`, { ephemeral: true });
        }

        let results = [];
        for (let i = 0; i < count; i++) {
            const prize = await calculateLotteryReward();
            if (!prize) {
                logger.error(interaction.user.tag+' | lottery: No prize could be calculated.');
                continue;
            }

            if(prize.reward.type === 'coin') {
                await giveCoins(profile, prize.reward.value, 'Lottery rewards');
            }
            if(prize.reward.type === 'xp') {
                await giveXP(profile, interaction.guildId, prize.reward.value, client, 'Lottery rewards'); 
            }

            results.push(`${prize.emoji} ${prize.reward.value} ${prize.description}`);
        }

        profile.luckyTokens -= count;
        profile.lastLotteryPlay = DateTime.now().setZone('America/New_York').toJSDate();
        profile.lotteryCount = (profile.lotteryCount || 0) + count;
        await profile.save();

        await interaction.reply({
            content: '🎰 Spinning the wheel...'
            //, ephemeral: true
        });

        setTimeout(async () => {
            try {
                const embed = new EmbedBuilder()
                    .setTitle('🎰 Lottery Results 🎰')
                    .setDescription(`<:lotterytoken:1269399775065804862> ${profile.luckyTokens} Lucky Tokens remaining.\n**Rewards:**\n`+results.join('\n'))
                    .setColor('#FFFF00')
                    .setFooter({ text: `You have played the lottery ${profile.lotteryCount} times.` });
            
            
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                logger.error(interaction.user.tag+' | lottery: '+error);
            }
        }, 3000);
    }
};
