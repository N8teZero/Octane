const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Profile = require('../models/Profile');
const { partBonuses } = require('../utils/main');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upgrade')
        .setDescription('Upgrades your vehicle with an item from your inventory.')
        .addStringOption(option => option.setName('item').setDescription('The item to install').setRequired(true)),
    category: 'General',    
    async execute(interaction) {
    let logger = await getLogger();
        const itemToInstall = interaction.options.getString('item');
        const profile = await Profile.findOne({ userId: interaction.user.id });
        const vehicle = profile.vehicles.find(v => v.isActive);

        if (!vehicle) {
            return interaction.reply({ content: "You have no active vehicle to upgrade.", ephemeral: true });
        }

        const item = profile.inventory.find(i => i.partName.toLowerCase() === itemToInstall.toLowerCase() && i.condition === 'Usable');

        logger.debug(`Player: ${interaction.user.tag} | Vehicle: ${vehicle.make} ${vehicle.model} - Upgrades: ${itemToInstall} Item: ${item}`);

        if (!item) {
            return interaction.reply({ content: "You don't have this item in usable condition.", ephemeral: true });
        }

        const existingUpgrade = vehicle.upgrades.find(u => u.type === itemToInstall);
        const bonuses = partBonuses[itemToInstall.toLowerCase()];
        if (existingUpgrade) {
            existingUpgrade.level += 1;
            existingUpgrade.stats.speed += bonuses.speed;
            existingUpgrade.stats.acceleration += bonuses.acceleration;
            existingUpgrade.stats.handling += bonuses.handling;
        } else {
            vehicle.upgrades.push({
                type: itemToInstall,
                level: 1,
                stats: {
                    speed: bonuses.speed,
                    acceleration: bonuses.acceleration,
                    handling: bonuses.handling
                }
            });
        }

        try {
            profile.inventory = profile.inventory.filter(i => i !== item);
            await profile.save();

            await interaction.reply({ content: `Your ${vehicle.make} ${vehicle.model} has been upgraded with ${itemToInstall}.`, ephemeral: true });
        } catch (error) {
            logger.error(interaction.user.tag+' | upgrade: '+error);
            await interaction.reply({ content: "An error occurred while upgrading your vehicle.", ephemeral: true });
        }
    }
};