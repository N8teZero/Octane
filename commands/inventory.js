const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Profile = require('../models/Profile');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Displays your inventory.'),
    category: 'General',
    async execute(interaction) {
    let logger = await getLogger();
        const profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            return interaction.reply({ content: "Profile not found.", ephemeral: true });
        }

        try {
            const partsSummary = profile.inventory.reduce((acc, item) => {
                if (!acc[item.partName]) {
                    acc[item.partName] = {};
                }
                if (!acc[item.partName][item.condition]) {
                    acc[item.partName][item.condition] = 0;
                }
                acc[item.partName][item.condition]++;
                return acc;
            }, {});
    
            const inventoryValue = profile.inventory.reduce((acc, item) => acc + item.value, 0);
            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username}'s Inventory`)
                .setColor('#00ff00')
                .setDescription(`*Broken, Damaged, and Worn parts can be scrapped with /scrap*\n*Usable parts can be equipped with /upgrade*`)
                .setFooter({ text: `Total Value: ${Math.floor(inventoryValue)} coins` });
    
            Object.entries(partsSummary).forEach(([part, conditions]) => {
                let description = '';
                Object.entries(conditions).forEach(([condition, count]) => {
                    const icon = condition === 'Usable' ? ':tools:' : '♻️';
                    description += `${icon} ${condition}: ${count}\n`;
                });
                embed.addFields({ name: part, value: description, inline: true });
            });
    
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(interaction.user.tag+' | inventory: '+error);
            await interaction.reply('An error occurred while generating the inventory embed.', { ephemeral: true });
        }
    }
};
