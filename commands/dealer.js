const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { shopVehicles } = require('../data/vehicles');
const { Profile } = require('../models');
const { DateTime } = require('luxon');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dealer')
        .setDescription('View and buy cars for sale at the shop.'),
    category: 'Economy',
    async execute(interaction) {
    let logger = await getLogger();
    
        const profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            await interaction.reply('No profile found.', { ephemeral: true });
            return;
        }

        const forSaleCars = shopVehicles.filter(v => v.level <= profile.level && v.forsale);
        //const forSaleCars = Vehicles.filter(v => v.level <= profile.level && v.price <= profile.coins && v.forsale);
        if (forSaleCars.length === 0) {
            await interaction.reply('No cars available for sale that you can afford.');
            return;
        }

        let pageIndex = 0;
        const vehicleImage = new AttachmentBuilder(forSaleCars[pageIndex].image, { name: 'vehicle.png' });
        let embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${forSaleCars[pageIndex].year} ${forSaleCars[pageIndex].make} ${forSaleCars[pageIndex].model}`)
            .setDescription(`You have <:coins:1269411594685644800> ${profile.coins.toLocaleString()}\nPrice: <:coins:1269411594685644800> ${forSaleCars[pageIndex].price.toLocaleString()}`)
            .setImage('attachment://vehicle.png')
            .addFields(
                { name: 'Speed', value: `${forSaleCars[pageIndex].stats.speed}`, inline: true },
                { name: 'Acceleration', value: `${forSaleCars[pageIndex].stats.acceleration}`, inline: true },
                { name: 'Handling', value: `${forSaleCars[pageIndex].stats.handling}`, inline: true },
                { name: 'Fuel Capacity', value: `${forSaleCars[pageIndex].stats.fuelCapacity}`, inline: true }
            )
            .setFooter({ text: `Page ${pageIndex + 1} of ${forSaleCars.length}` });
            //logger.debug(`Speed: ${forSaleCars[pageIndex].stats.speed} | Acceleration: ${forSaleCars[pageIndex].stats.acceleration} | Handling: ${forSaleCars[pageIndex].stats.handling} | Fuel: ${forSaleCars[pageIndex].stats.fuelCapacity}`);
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageIndex === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(forSaleCars.length === 1),
                new ButtonBuilder()
                    .setCustomId('buy')
                    .setLabel('Buy')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row], files: [vehicleImage] });

        const filter = i => ['previous', 'next', 'buy'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await i.deferUpdate();

            switch (i.customId) {
                case 'previous':
                    pageIndex = Math.max(pageIndex - 1, 0);
                    break;
                case 'next':
                    pageIndex = Math.min(pageIndex + 1, forSaleCars.length - 1);
                    break;
                case 'buy':
                    const car = forSaleCars[pageIndex];
                    if (profile.coins < car.price) {
                        await interaction.editReply({ content: `You do not have enough Coins to buy the ${car.make} ${car.model}. You need $${(car.price - profile.coins).toLocaleString()} more.`, ephemeral: true });
                        return;
                    }

                    if (profile.vehicles.find(v => v.make === car.make && v.model === car.model)) {
                        await interaction.editReply({ content: `You already own the ${car.make} ${car.model}.`, ephemeral: true });
                        return;
                    }

                    if (profile.vehicles.length >= 2) {
                        await interaction.editReply({ content: `Your garage can only store 2 vehicles.`, ephemeral: true });
                        return;
                    }
                
                    profile.coins -= car.price;
                    profile.vehicles.push(car);
                    await profile.save();
                    await interaction.editReply({ content: `You have purchased the ${car.make} ${car.model}.`, embeds: [], components: [] });
                    collector.stop();
                    break;
            }

            embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${forSaleCars[pageIndex].year} ${forSaleCars[pageIndex].make} ${forSaleCars[pageIndex].model}`)
                .setDescription(`You have <:coins:1269411594685644800> ${profile.coins.toLocaleString()}\nPrice: <:coins:1269411594685644800> ${forSaleCars[pageIndex].price.toLocaleString()}`)
                .setImage('attachment://vehicle.png')
                .addFields(
                    { name: 'Speed', value: `${forSaleCars[pageIndex].stats.speed}`, inline: true },
                    { name: 'Acceleration', value: `${forSaleCars[pageIndex].stats.acceleration}`, inline: true },
                    { name: 'Handling', value: `${forSaleCars[pageIndex].stats.handling}`, inline: true },
                    { name: 'Fuel Capacity', value: `${forSaleCars[pageIndex].stats.fuelCapacity}`, inline: true }
                )
                .setFooter({ text: `Page ${pageIndex + 1} of ${forSaleCars.length}` });
            
            row.components[0].setDisabled(pageIndex === 0);
            row.components[1].setDisabled(pageIndex === forSaleCars.length - 1);

            await i.editReply({ embeds: [embed], components: [row] });
        });

        collector.on('end', () => {
            interaction.editReply({ content: 'Dealer session has ended.', components: [] });
        });
    }
};