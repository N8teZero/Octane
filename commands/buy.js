const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/Profile');
const { getLogger } = require('../utils/logging');
const Item = require('../models/Items');
const { getItemDetails, itemPurchase } = require('../utils/main');
const { DateTime } = require('luxon');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase items from the store')
        .addStringOption(option => 
            option.setName('item')
                .setDescription('The ID of the item to buy')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('The number of items to buy')
                .setRequired(false)
                .setMinValue(1)),
    category: 'Economy',
    async execute(interaction) {
    let logger = await getLogger();
        const item = interaction.options.getString('item').toLowerCase();
        const quantity = interaction.options.getInteger('quantity') || 1;

        const profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            await interaction.reply({ content: "You need to create a profile to buy items.", ephemeral: true });
            return;
        }

        try {
            const itemExists = await Item.exists({ itemId: item });
            const itemDetails = await getItemDetails(item);
            
            if (!itemExists || !itemDetails.enabled) {
                await interaction.reply({ content: "Item not found. Please confirm with the /store command.", ephemeral: true });
                return;
            }

            if (profile.coins < itemDetails.totalCost) {
                await interaction.reply({ content: `You do not have enough coins. You need ${itemDetails.totalCost}, but you have ${profile.coins}.`, ephemeral: true });
                return;
            }

            if (itemDetails.type === 'booster' && quantity > 1) {
                await interaction.reply({ content: `You may only purchase one ${item} at a time.`, ephemeral: true });
                return;
            }

            const now = DateTime.now().setZone('America/New_York');
            const xpActive = profile.booster.xpExpires > now;
            const coinsActive = profile.booster.coinsExpires > now;

            if (item === 'booster_xp' && xpActive) {
                await interaction.reply({ content: `You already have an active XP booster.`, ephemeral: true });
                return;
            } else if (item === 'booster_coins' && coinsActive) {
                await interaction.reply({ content: `You already have an active Coins booster.`, ephemeral: true });
                return;
            }
    
            await itemPurchase(profile, item, quantity);
    
            await interaction.reply({ content: `You have successfully purchased ${quantity} ${itemDetails.name}.`, ephemeral: false });
        } catch (err) {
            logger.error(interaction.user.tag+' | buy: '+err);
            await interaction.reply({ content: 'An error occurred while processing your purchase.', ephemeral: true });
        }
        
    }
};
