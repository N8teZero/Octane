const { DateTime } = require('luxon');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');
const { Profile, Vehicle } = require('../models');

const { calculateShrineLevel } = require('./main');

async function getShrineEmbed(profile) {
    const shrineLvl = await calculateShrineLevel(profile.shrineXP);
    const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`Car Gods Shrine - Level ${shrineLvl}`)
        .setDescription(`<:feastSupplies:1286849566523654269> ${[profile.feastSupplies]}\n\nSpend 100 Feast Supplies to unlock a random blessing.`)
        .setFooter({text: 'Shrine XP: ' + profile.shrineXP});

    now = DateTime.now().setZone('America/New_York').toJSDate()
    const rows = [
        new ActionRowBuilder(),
        new ActionRowBuilder()
    ];

    profile.blessings.forEach((blessing, index) => {
        const lockState = blessing.locked ? '🔒' : '🔓';
        const lockLabel = blessing.locked ? 'Unlock' : 'Lock';
        const bonusInfo = Object.entries(blessing.stats)
        .filter(([stat, value]) => value > 0)
        .map(([stat, value]) => `${stat} ${value}x`)
        .join('\n');
        const bonusDescription = blessing.active ? `${bonusInfo}\n**Level:** ${blessing.level}` : 'Inactive';
        embed.addFields({
            name: `Blessing ${index + 1} (${lockState})`,
            value: bonusDescription,
            inline: true
        });

        //console.log(`toggle_lock_${index}`);
        const disableButton = !blessing.active;
        const button = new ButtonBuilder()
            .setCustomId(`toggle_lock_${index}`)
            .setLabel(lockLabel)
            .setEmoji(lockState)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disableButton);

        if (index < 3) {
            rows[0].addComponents(button);
        } else {
            rows[1].addComponents(button);
        }
    });

    const getBlessingButton = new ButtonBuilder()
        .setCustomId('getBlessing')
        .setLabel('Get Blessing')
        .setStyle(ButtonStyle.Success)
        .setDisabled(profile.feastSupplies < 100);

    rows[1].addComponents(getBlessingButton);

    return { embed, rows };
}

async function getStartEmbed(interaction, starterCars, pageIndex) {
    const resizedBuffer = await sharp(starterCars[pageIndex].image)
            .resize(180, 180)
            .toBuffer();
    const vehicleImage = new AttachmentBuilder(resizedBuffer, { name: 'vehicle.png' });
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`Choose a starting vehicle...`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription('They might not be the fastest, but they are free!')
        .setImage('attachment://vehicle.png')
        .addFields(
            { name: 'Vehicle', value: `${starterCars[pageIndex].year} ${starterCars[pageIndex].make} ${starterCars[pageIndex].model}`, inline: false },
            { name: 'Speed', value: `${starterCars[pageIndex].stats.speed}`, inline: true },
            { name: 'Acceleration', value: `${starterCars[pageIndex].stats.acceleration}`, inline: true },
            { name: 'Grip', value: `${starterCars[pageIndex].stats.grip}`, inline: true },
            { name: 'Suspension', value: `${starterCars[pageIndex].stats.suspension}`, inline: true },
            { name: 'Brakes', value: `${starterCars[pageIndex].stats.brakes}`, inline: true },
            { name: 'Durability', value: `${starterCars[pageIndex].stats.durability}`, inline: true },
            { name: 'Aerodynamics', value: `${starterCars[pageIndex].stats.aerodynamics}`, inline: true },
            { name: 'Torque', value: `${starterCars[pageIndex].stats.torque}`, inline: true },
            { name: 'Horsepower', value: `${starterCars[pageIndex].stats.horsepower}`, inline: true },
            { name: 'Fuel Capacity', value: `${starterCars[pageIndex].stats.fuelCapacity}`, inline: true }
        )
        .setFooter({ text: `Page ${pageIndex + 1} of ${starterCars.length}` });

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
                    .setDisabled(pageIndex === starterCars.length - 1),
                new ButtonBuilder()
                    .setCustomId('select')
                    .setLabel('Select')
                    .setStyle(ButtonStyle.Success)
            );
    
    return { embed, row, vehicleImage };
}

async function getDealerEmbed(interaction, forSaleCars, pageIndex) {
    const profile = await Profile.findOne({ userId: interaction.user.id });
    const resizedBuffer = await sharp(forSaleCars[pageIndex].image)
            .resize(180, 180)
            .toBuffer();
    const vehicleImage = new AttachmentBuilder(resizedBuffer, { name: 'vehicle.png' });
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Vehicle Dealership`)
        .setDescription(`You have <:coins:1269411594685644800> ${profile.coins.toLocaleString()}\nPrice: <:coins:1269411594685644800> ${forSaleCars[pageIndex].price.toLocaleString()}`)
        .setImage('attachment://vehicle.png')
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Vehicle', value: `${forSaleCars[pageIndex].year} ${forSaleCars[pageIndex].make} ${forSaleCars[pageIndex].model}`, inline: false },
            { name: 'Speed', value: `${forSaleCars[pageIndex].stats.speed}`, inline: true },
            { name: 'Acceleration', value: `${forSaleCars[pageIndex].stats.acceleration}`, inline: true },
            { name: 'Grip', value: `${forSaleCars[pageIndex].stats.grip}`, inline: true },
            { name: 'Suspension', value: `${forSaleCars[pageIndex].stats.suspension}`, inline: true },
            { name: 'Brakes', value: `${forSaleCars[pageIndex].stats.brakes}`, inline: true },
            { name: 'Durability', value: `${forSaleCars[pageIndex].stats.durability}`, inline: true },
            { name: 'Aerodynamics', value: `${forSaleCars[pageIndex].stats.aerodynamics}`, inline: true },
            { name: 'Torque', value: `${forSaleCars[pageIndex].stats.torque}`, inline: true },
            { name: 'Horsepower', value: `${forSaleCars[pageIndex].stats.horsepower}`, inline: true },
            { name: 'Fuel Capacity', value: `${forSaleCars[pageIndex].stats.fuelCapacity}`, inline: true }
        )
        .setFooter({ text: `Page ${pageIndex + 1} of ${forSaleCars.length}` });

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
                    .setDisabled(pageIndex === forSaleCars.length - 1),
                new ButtonBuilder()
                    .setCustomId('buy')
                    .setLabel('Buy')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!forSaleCars[pageIndex].forSale)
            );
    
    return { embed, row, vehicleImage };
}

module.exports = {
    getShrineEmbed,
    getStartEmbed,
    getDealerEmbed
};